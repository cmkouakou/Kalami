/**
 * Fichier    : strategy-classes-rls.test.ts
 * Projet     : Kalami Stratégie
 * Description: Tests d'intégration du mode enseignant (S10a) sur la base de développement :
 *              statut enseignant requis, classe invisible aux autres, inscription par lien
 *              et par invitation (courriel invité seulement), distribution (crédits,
 *              groupes, rôles, enseignant observateur non retirable), suivi, coach coupé
 *              par étape, archivage et départ d'un étudiant. Aucun courriel n'est envoyé
 *              (appels SQL directs). Ignorés si les clés manquent ou si la migration
 *              20261029120000 n'est pas encore appliquée.
 * Auteur     : Claude Marcel
 * Date       : 2026-10-16
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const secretKey = process.env.SUPABASE_SECRET_KEY;
const enabled = Boolean(url && publishableKey && secretKey);

const NO_SESSION = { auth: { persistSession: false, autoRefreshToken: false } };
const RUN = crypto.randomUUID().slice(0, 8);

/** Vrai si la migration S10a est appliquée (table des classes présente). */
async function migrationApplied(): Promise<boolean> {
  if (!enabled) return false;
  const service = createClient(url!, secretKey!, NO_SESSION);
  const { error } = await service.from("classes").select("id").limit(1);
  return !error;
}

const ready = await migrationApplied();

/** Jeton de test (au moins 32 caractères). */
function token(): string {
  return `jeton-${crypto.randomUUID()}-${crypto.randomUUID()}`;
}

describe.skipIf(!ready)("RLS — mode enseignant (S10a)", () => {
  let service: SupabaseClient;
  let teacher: SupabaseClient;
  let studentA: SupabaseClient;
  let studentB: SupabaseClient;
  let studentC: SupabaseClient;
  let stranger: SupabaseClient;
  const userIds: string[] = [];
  const emails: string[] = [];
  let classId = "";
  let studyIds: string[] = [];
  const linkToken = token();
  const inviteToken = token();

  /** Crée un utilisateur confirmé et retourne un client connecté. */
  async function signedInUser(label: string): Promise<SupabaseClient> {
    const email = `${label}-${RUN}@test.kalami.local`;
    const password = `Test-${crypto.randomUUID()}`;
    const created = await service.auth.admin.createUser({ email, password, email_confirm: true });
    if (created.error) throw created.error;
    userIds.push(created.data.user.id);
    emails.push(email);
    const client = createClient(url!, publishableKey!, NO_SESSION);
    const signedIn = await client.auth.signInWithPassword({ email, password });
    if (signedIn.error) throw signedIn.error;
    return client;
  }

  /** Remplace les réglages de la classe (strategy_update_class remplace tous les champs). */
  async function updateClass(values: { steps?: number[]; status?: string }) {
    return teacher.rpc("strategy_update_class", {
      p_class_id: classId,
      p_name: `Classe ${RUN}`,
      p_institution: "HEC",
      p_term: "Automne 2026",
      p_due_date: null,
      p_coach_disabled_steps: values.steps ?? [],
      p_study_budget: null,
      p_status: values.status ?? "active",
    });
  }

  beforeAll(async () => {
    service = createClient(url!, secretKey!, NO_SESSION);
    teacher = await signedInUser("classe-prof");
    studentA = await signedInUser("classe-etu-a");
    studentB = await signedInUser("classe-etu-b");
    studentC = await signedInUser("classe-etu-c");
    stranger = await signedInUser("classe-autre");

    const granted = await service.from("strategy_teachers").insert({ user_id: userIds[0] });
    if (granted.error) throw granted.error;
    const credits = await service.from("study_credits").insert(
      [1, 2, 3].map(() => ({ user_id: userIds[0], source: "admin_grant", note: `test ${RUN}` })),
    );
    if (credits.error) throw credits.error;
  });

  afterAll(async () => {
    if (classId) {
      await service.from("studies").delete().eq("class_id", classId);
      await service.from("classes").delete().eq("id", classId);
    }
    for (const id of userIds) await service.auth.admin.deleteUser(id);
  });

  it("réserve la création de classe aux enseignants", async () => {
    const refused = await stranger.rpc("strategy_create_class", {
      p_name: "Pas enseignant",
      p_institution: "",
      p_term: "",
      p_due_date: null,
    });
    expect(refused.error?.code).toBe("42501");

    const created = await teacher.rpc("strategy_create_class", {
      p_name: `Classe ${RUN}`,
      p_institution: "HEC",
      p_term: "Automne 2026",
      p_due_date: null,
    });
    expect(created.error).toBeNull();
    classId = created.data as string;
  });

  it("cache la classe et son suivi aux autres comptes", async () => {
    const { data } = await stranger.from("classes").select("id").eq("id", classId);
    expect(data).toEqual([]);
    const tracking = await stranger.rpc("strategy_class_tracking", { p_class_id: classId });
    expect(tracking.error?.code).toBe("42501");
    const link = await stranger.rpc("strategy_set_class_link", {
      p_class_id: classId,
      p_token: token(),
    });
    expect(link.error?.code).toBe("42501");
  });

  it("inscrit par le lien de classe, une seule fois", async () => {
    const set = await teacher.rpc("strategy_set_class_link", {
      p_class_id: classId,
      p_token: linkToken,
    });
    expect(set.error).toBeNull();

    const preview = await studentA.rpc("strategy_class_by_token", { p_token: linkToken });
    expect(preview.data?.[0]).toMatchObject({ class_id: classId, kind: "link" });

    for (const client of [studentA, studentA, studentB]) {
      const joined = await client.rpc("strategy_join_class", { p_token: linkToken });
      expect(joined.error).toBeNull();
      expect(joined.data).toBe(classId);
    }
    const self = await teacher.rpc("strategy_join_class", { p_token: linkToken });
    expect(self.error?.message).toBe("is_teacher");
  });

  it("n'accepte une invitation que du courriel invité", async () => {
    const invited = await teacher.rpc("strategy_invite_student", {
      p_class_id: classId,
      p_email: emails[3].toUpperCase(),
      p_token: inviteToken,
    });
    expect(invited.error).toBeNull();

    const wrong = await studentB.rpc("strategy_join_class", { p_token: inviteToken });
    expect(wrong.error?.message).toBe("email_mismatch");
    const right = await studentC.rpc("strategy_join_class", { p_token: inviteToken });
    expect(right.error).toBeNull();
    const again = await studentC.rpc("strategy_join_class", { p_token: inviteToken });
    expect(again.error?.message).toBe("invitation_closed");

    const students = await teacher.rpc("strategy_class_students", { p_class_id: classId });
    expect((students.data as unknown[]).length).toBe(3);
  });

  it("refuse les groupes invalides et le manque de crédits", async () => {
    const outsider = await teacher.rpc("strategy_distribute_studies", {
      p_class_id: classId,
      p_company_name: "Ajinomoto",
      p_strategic_question: "",
      p_groups: [[userIds[4]]],
    });
    expect(outsider.error?.message).toBe("invalid_groups");

    const twice = await teacher.rpc("strategy_distribute_studies", {
      p_class_id: classId,
      p_company_name: "Ajinomoto",
      p_strategic_question: "",
      p_groups: [[userIds[1]], [userIds[1], userIds[2]]],
    });
    expect(twice.error?.message).toBe("invalid_groups");

    const tooMany = await teacher.rpc("strategy_distribute_studies", {
      p_class_id: classId,
      p_company_name: "Ajinomoto",
      p_strategic_question: "",
      p_groups: [Array.from({ length: 7 }, () => crypto.randomUUID())],
    });
    expect(tooMany.error?.message).toBe("invalid_groups");
  });

  it("distribue une étude par groupe et consomme un crédit chacune", async () => {
    const distributed = await teacher.rpc("strategy_distribute_studies", {
      p_class_id: classId,
      p_company_name: "Ajinomoto",
      p_strategic_question: "Faut-il croître ?",
      p_groups: [[userIds[1]], [userIds[2], userIds[3]]],
    });
    expect(distributed.error).toBeNull();
    studyIds = distributed.data as string[];
    expect(studyIds).toHaveLength(2);

    const { data: members } = await service
      .from("study_members")
      .select("study_id, user_id, role")
      .in("study_id", studyIds);
    const roleOf = (studyId: string, userId: string) =>
      members?.find((row) => row.study_id === studyId && row.user_id === userId)?.role;
    expect(roleOf(studyIds[0], userIds[1])).toBe("owner");
    expect(roleOf(studyIds[0], userIds[0])).toBe("observer");
    expect(roleOf(studyIds[1], userIds[2])).toBe("owner");
    expect(roleOf(studyIds[1], userIds[3])).toBe("contributor");

    const { count } = await service
      .from("study_credits")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userIds[0])
      .is("consumed_at", null);
    expect(count).toBe(1);

    const short = await teacher.rpc("strategy_distribute_studies", {
      p_class_id: classId,
      p_company_name: "Infosystem",
      p_strategic_question: "",
      p_groups: [[userIds[1]], [userIds[2]]],
    });
    expect(short.error?.message).toBe("not_enough_credits");
  });

  it("garde l'enseignant comme observateur non retirable", async () => {
    const removed = await studentA.rpc("strategy_remove_member", {
      p_study_id: studyIds[0],
      p_user_id: userIds[0],
    });
    expect(removed.error?.message).toBe("class_teacher");
    const promoted = await studentA.rpc("strategy_set_member_role", {
      p_study_id: studyIds[0],
      p_user_id: userIds[0],
      p_role: "contributor",
    });
    expect(promoted.error?.message).toBe("class_teacher");

    const studyClass = await studentA.rpc("strategy_study_class", { p_study_id: studyIds[0] });
    expect(studyClass.data?.[0]).toMatchObject({ class_id: classId, teacher_id: userIds[0] });
    const outside = await stranger.rpc("strategy_study_class", { p_study_id: studyIds[0] });
    expect(outside.data).toEqual([]);
  });

  it("donne à l'enseignant le suivi sans l'observateur", async () => {
    const { data, error } = await teacher.rpc("strategy_class_tracking", {
      p_class_id: classId,
    });
    expect(error).toBeNull();
    const rows = data as { study_id: string; members: { userId: string }[]; steps: string[] }[];
    expect(rows.map((row) => row.study_id).sort()).toEqual([...studyIds].sort());
    for (const row of rows) {
      expect(row.steps).toHaveLength(9);
      expect(row.members.some((member) => member.userId === userIds[0])).toBe(false);
    }

    const mine = await studentA.rpc("strategy_student_classes");
    expect(mine.data?.[0]).toMatchObject({ class_id: classId, status: "active" });
  });

  it("coupe le coach aux étapes choisies par l'enseignant", async () => {
    expect((await updateClass({ steps: [1] })).error).toBeNull();
    // Profil complet : l'étape 1 n'a pas d'autre prérequis
    const profile = await service
      .from("company_profiles")
      .update({ data: { sector: "Agroalimentaire", countries: ["CI"], offers: ["Ajinomoto"] } })
      .eq("study_id", studyIds[0]);
    expect(profile.error).toBeNull();
    const { data: settings } = await service
      .from("strategy_settings")
      .select("coach_enabled")
      .single();
    const reserved = await studentA.rpc("coach_reserve", {
      p_study_id: studyIds[0],
      p_step_no: 1,
      p_function: "review",
      p_estimate: 0.01,
    });
    expect(reserved.error).toBeNull();
    expect(reserved.data?.[0]?.refusal).toBe(
      settings?.coach_enabled ? "coach_disabled_step" : "coach_disabled",
    );
    expect((await updateClass({ steps: [9] })).error?.message).toBe("invalid_steps");
  });

  it("ferme inscriptions et distribution d'une classe archivée", async () => {
    expect((await updateClass({ status: "archived" })).error).toBeNull();
    const joined = await stranger.rpc("strategy_join_class", { p_token: linkToken });
    expect(joined.error?.message).toBe("class_archived");
    const distributed = await teacher.rpc("strategy_distribute_studies", {
      p_class_id: classId,
      p_company_name: "Infosystem",
      p_strategic_question: "",
      p_groups: [[userIds[1]]],
    });
    expect(distributed.error?.message).toBe("class_archived");

    const { data } = await service.from("studies").select("id").eq("class_id", classId);
    expect(data).toHaveLength(2);
    expect((await updateClass({ status: "active" })).error).toBeNull();
  });

  it("laisse un étudiant quitter la classe, pas en retirer un autre", async () => {
    const other = await studentA.rpc("strategy_remove_student", {
      p_class_id: classId,
      p_user_id: userIds[2],
    });
    expect(other.error?.code).toBe("42501");
    const left = await studentB.rpc("strategy_remove_student", {
      p_class_id: classId,
      p_user_id: userIds[2],
    });
    expect(left.error).toBeNull();

    const again = await studentB.rpc("strategy_remove_student", {
      p_class_id: classId,
      p_user_id: userIds[2],
    });
    expect(again.error?.message).toBe("not_member");

    // Quitter la classe ne retire pas l'étudiant de son étude
    const students = await teacher.rpc("strategy_class_students", { p_class_id: classId });
    expect((students.data as unknown[]).length).toBe(2);
    const { data } = await studentB.from("study_members").select("user_id").eq(
      "study_id",
      studyIds[1],
    );
    expect(data).toHaveLength(3);
  });
});
