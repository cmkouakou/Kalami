/**
 * Fichier    : strategy-team-rls.test.ts
 * Projet     : Kalami Stratégie
 * Description: Tests d'intégration du travail en équipe (S9a) sur la base de développement :
 *              seul le propriétaire invite ; le lien n'accepte que le courriel invité ;
 *              l'invité devient membre avec le rôle prévu ; responsables d'étape, changement
 *              de rôle, départ et journal d'activité. Aucun courriel n'est envoyé (appels SQL
 *              directs). Ignorés si les clés manquent ou si la migration 20261026120000
 *              n'est pas encore appliquée.
 * Auteur     : Claude Marcel
 * Date       : 2026-10-15
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const secretKey = process.env.SUPABASE_SECRET_KEY;
const enabled = Boolean(url && publishableKey && secretKey);

const NO_SESSION = { auth: { persistSession: false, autoRefreshToken: false } };
const RUN = crypto.randomUUID().slice(0, 8);

/** Vrai si la migration S9a est appliquée (table des invitations présente). */
async function migrationApplied(): Promise<boolean> {
  if (!enabled) return false;
  const service = createClient(url!, secretKey!, NO_SESSION);
  const { error } = await service.from("study_invitations").select("id").limit(1);
  return !error;
}

const ready = await migrationApplied();

/** Jeton d'invitation de test (au moins 32 caractères). */
function token(): string {
  return `jeton-${crypto.randomUUID()}-${crypto.randomUUID()}`;
}

describe.skipIf(!ready)("RLS — équipe et invitations (S9a)", () => {
  let service: SupabaseClient;
  let owner: SupabaseClient;
  let guest: SupabaseClient;
  let stranger: SupabaseClient;
  const userIds: string[] = [];
  const emails: string[] = [];
  let studyId = "";
  let invitationId = "";
  const guestToken = token();

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

  /** Actions du journal, de la plus récente à la plus ancienne. */
  async function journal(client: SupabaseClient): Promise<string[]> {
    const { data, error } = await client.rpc("strategy_study_activity", {
      p_study_id: studyId,
    });
    if (error) throw error;
    return (data as { action: string }[]).map((row) => row.action);
  }

  beforeAll(async () => {
    service = createClient(url!, secretKey!, NO_SESSION);
    owner = await signedInUser("equipe-proprio");
    guest = await signedInUser("equipe-invite");
    stranger = await signedInUser("equipe-autre");

    const credit = await service
      .from("study_credits")
      .insert({ user_id: userIds[0], source: "admin_grant", note: `test ${RUN}` });
    if (credit.error) throw credit.error;
    const created = await owner.rpc("strategy_create_study", {
      p_company_name: `Équipe ${RUN}`,
      p_strategic_question: "Faut-il croître ?",
    });
    if (created.error) throw created.error;
    studyId = created.data as string;
  });

  afterAll(async () => {
    if (studyId) await service.from("studies").delete().eq("id", studyId);
    for (const id of userIds) await service.auth.admin.deleteUser(id);
  });

  it("refuse une invitation par une personne qui n'est pas propriétaire", async () => {
    const { error } = await stranger.rpc("strategy_invite_member", {
      p_study_id: studyId,
      p_email: emails[1],
      p_role: "contributor",
      p_token: token(),
    });
    expect(error?.code).toBe("42501");
  });

  it("valide le rôle, le courriel et refuse d'inviter un membre", async () => {
    const cases = [
      [{ p_email: emails[1], p_role: "owner" }, "invalid_role"],
      [{ p_email: "pas-un-courriel", p_role: "observer" }, "invalid_email"],
      [{ p_email: emails[0], p_role: "observer" }, "already_member"],
    ] as const;
    for (const [args, message] of cases) {
      const { error } = await owner.rpc("strategy_invite_member", {
        p_study_id: studyId,
        p_token: token(),
        ...args,
      });
      expect(error?.message).toBe(message);
    }
  });

  it("invite une personne une seule fois", async () => {
    const invited = await owner.rpc("strategy_invite_member", {
      p_study_id: studyId,
      p_email: emails[1].toUpperCase(),
      p_role: "contributor",
      p_token: guestToken,
    });
    expect(invited.error).toBeNull();
    invitationId = invited.data as string;

    const again = await owner.rpc("strategy_invite_member", {
      p_study_id: studyId,
      p_email: emails[1],
      p_role: "observer",
      p_token: token(),
    });
    expect(again.error?.message).toBe("already_invited");
  });

  it("ne montre les invitations qu'au propriétaire et ne stocke pas le jeton", async () => {
    const own = await owner.from("study_invitations").select("email, token_hash");
    expect(own.data?.map((row) => row.email)).toContain(emails[1]);
    expect(own.data?.some((row) => row.token_hash === guestToken)).toBe(false);

    const other = await stranger.from("study_invitations").select("id");
    expect(other.data ?? []).toHaveLength(0);
  });

  it("présente l'invitation et vérifie le courriel de la personne connectée", async () => {
    const seen = await stranger.rpc("strategy_invitation_by_token", { p_token: guestToken });
    expect(seen.error).toBeNull();
    const row = (seen.data as { email_matches: boolean; status: string }[])[0];
    expect(row.status).toBe("pending");
    expect(row.email_matches).toBe(false);

    const unknown = await guest.rpc("strategy_invitation_by_token", { p_token: token() });
    expect(unknown.data ?? []).toHaveLength(0);

    const refused = await stranger.rpc("strategy_respond_invitation", {
      p_invitation_id: invitationId,
      p_accept: true,
    });
    expect(refused.error?.message).toBe("email_mismatch");
  });

  it("liste l'invitation reçue puis l'accepte avec le rôle prévu", async () => {
    const received = await guest.rpc("strategy_my_invitations");
    expect((received.data as { invitation_id: string }[]).map((r) => r.invitation_id))
      .toContain(invitationId);

    const accepted = await guest.rpc("strategy_respond_invitation", {
      p_invitation_id: invitationId,
      p_accept: true,
    });
    expect(accepted.error).toBeNull();
    expect(accepted.data).toBe(studyId);

    const members = await guest.rpc("strategy_study_members", { p_study_id: studyId });
    const me = (members.data as { user_id: string; role: string }[])
      .find((m) => m.user_id === userIds[1]);
    expect(me?.role).toBe("contributor");

    const twice = await guest.rpc("strategy_respond_invitation", {
      p_invitation_id: invitationId,
      p_accept: true,
    });
    expect(twice.error?.message).toBe("invitation_closed");
  });

  it("refuse la liste des membres et le journal à une personne extérieure", async () => {
    const members = await stranger.rpc("strategy_study_members", { p_study_id: studyId });
    expect(members.error?.code).toBe("42501");
    const activity = await stranger.rpc("strategy_study_activity", { p_study_id: studyId });
    expect(activity.error?.code).toBe("42501");
  });

  it("confie une étape à un contributeur, jamais à un observateur", async () => {
    const byGuest = await guest.rpc("strategy_assign_step", {
      p_study_id: studyId,
      p_step_no: 1,
      p_user_id: userIds[1],
    });
    expect(byGuest.error?.code).toBe("42501");

    const assigned = await owner.rpc("strategy_assign_step", {
      p_study_id: studyId,
      p_step_no: 1,
      p_user_id: userIds[1],
    });
    expect(assigned.error).toBeNull();
    const { data } = await service
      .from("study_steps")
      .select("assignee_id")
      .eq("study_id", studyId)
      .eq("step_no", 1)
      .single<{ assignee_id: string | null }>();
    expect(data?.assignee_id).toBe(userIds[1]);

    const role = await owner.rpc("strategy_set_member_role", {
      p_study_id: studyId,
      p_user_id: userIds[1],
      p_role: "observer",
    });
    expect(role.error).toBeNull();
    const refused = await owner.rpc("strategy_assign_step", {
      p_study_id: studyId,
      p_step_no: 2,
      p_user_id: userIds[1],
    });
    expect(refused.error?.message).toBe("invalid_assignee");
  });

  it("protège le rôle du propriétaire", async () => {
    const { error } = await owner.rpc("strategy_remove_member", {
      p_study_id: studyId,
      p_user_id: userIds[0],
    });
    expect(error?.message).toBe("owner_role");
  });

  it("consigne les actions dans le journal, puis laisse l'invité partir", async () => {
    const actions = await journal(owner);
    for (const action of ["invitation_sent", "member_joined", "step_assigned",
      "member_role_changed"]) {
      expect(actions).toContain(action);
    }

    const left = await guest.rpc("strategy_remove_member", {
      p_study_id: studyId,
      p_user_id: userIds[1],
    });
    expect(left.error).toBeNull();
    expect(await journal(owner)).toContain("member_left");
  });
});
