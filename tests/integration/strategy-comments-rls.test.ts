/**
 * Fichier    : strategy-comments-rls.test.ts
 * Projet     : Kalami Stratégie
 * Description: Tests d'intégration de la discussion d'équipe (S9b) sur la base de
 *              développement : seuls les membres commentent et lisent ; mentions limitées
 *              aux membres ; une notification par personne (mention > réponse > étape
 *              confiée) ; droits de modification, suppression et résolution ; préférence
 *              de courriel ; aucun accès direct aux notifications. Aucun courriel n'est
 *              envoyé (appels SQL directs). Ignorés si les clés manquent ou si la migration
 *              20261027120000 n'est pas encore appliquée.
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

/** Vrai si la migration S9b est appliquée (table des commentaires présente). */
async function migrationApplied(): Promise<boolean> {
  if (!enabled) return false;
  const service = createClient(url!, secretKey!, NO_SESSION);
  const { error } = await service.from("study_comments").select("id").limit(1);
  return !error;
}

const ready = await migrationApplied();

type AddResult = { id: string; emails: string[] };
type Notification = { id: number; kind: string; comment_id: string; read_at: string | null };
type Comment = { id: string; body: string; deleted: boolean; edited_at: string | null;
  resolved_at: string | null; mentions: string[] };

describe.skipIf(!ready)("RLS — commentaires et notifications (S9b)", () => {
  let service: SupabaseClient;
  let owner: SupabaseClient;
  let member: SupabaseClient;
  let stranger: SupabaseClient;
  const userIds: string[] = [];
  const emails: string[] = [];
  let studyId = "";
  let rootId = "";

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

  /** Publie un commentaire sur l'étape 1 et retourne la réponse de la fonction SQL. */
  function add(
    client: SupabaseClient,
    body: string,
    options: { parent?: string; target?: string; label?: string; mentions?: string[] } = {},
  ) {
    return client.rpc("strategy_add_comment", {
      p_study_id: studyId,
      p_step_no: 1,
      p_body: body,
      p_parent_id: options.parent ?? null,
      p_target_id: options.target ?? null,
      p_target_label: options.label ?? null,
      p_mentions: options.mentions ?? [],
    });
  }

  /** Notifications de la personne connectée, de la plus récente à la plus ancienne. */
  async function notifications(client: SupabaseClient): Promise<Notification[]> {
    const { data, error } = await client.rpc("strategy_my_notifications", {});
    if (error) throw error;
    return data as Notification[];
  }

  /** Commentaires de l'étape 1 vus par un membre. */
  async function comments(client: SupabaseClient): Promise<Comment[]> {
    const { data, error } = await client.rpc("strategy_step_comments", {
      p_study_id: studyId,
      p_step_no: 1,
    });
    if (error) throw error;
    return data as Comment[];
  }

  beforeAll(async () => {
    service = createClient(url!, secretKey!, NO_SESSION);
    owner = await signedInUser("discussion-proprio");
    member = await signedInUser("discussion-membre");
    stranger = await signedInUser("discussion-autre");

    const credit = await service
      .from("study_credits")
      .insert({ user_id: userIds[0], source: "admin_grant", note: `test ${RUN}` });
    if (credit.error) throw credit.error;
    const created = await owner.rpc("strategy_create_study", {
      p_company_name: `Discussion ${RUN}`,
      p_strategic_question: "Faut-il croître ?",
    });
    if (created.error) throw created.error;
    studyId = created.data as string;

    const joined = await service
      .from("study_members")
      .insert({ study_id: studyId, user_id: userIds[1], role: "contributor" });
    if (joined.error) throw joined.error;
    const assigned = await owner.rpc("strategy_assign_step", {
      p_study_id: studyId,
      p_step_no: 1,
      p_user_id: userIds[1],
    });
    if (assigned.error) throw assigned.error;
  });

  afterAll(async () => {
    if (studyId) await service.from("studies").delete().eq("id", studyId);
    for (const id of userIds) await service.auth.admin.deleteUser(id);
  });

  it("refuse les commentaires et la lecture à une personne extérieure", async () => {
    const added = await add(stranger, "Bonjour");
    expect(added.error?.code).toBe("42501");
    const read = await stranger.rpc("strategy_step_comments", {
      p_study_id: studyId,
      p_step_no: 1,
    });
    expect(read.error?.code).toBe("42501");
  });

  it("valide le texte, l'étape et l'élément visé", async () => {
    expect((await add(member, "   ")).error?.message).toBe("invalid_comment");
    expect((await add(member, "x".repeat(2001))).error?.message).toBe("invalid_comment");
    expect((await add(member, "Bonjour", { target: "pas un id !" })).error?.message)
      .toBe("invalid_target");
    const step = await member.rpc("strategy_add_comment", {
      p_study_id: studyId,
      p_step_no: 10,
      p_body: "Bonjour",
      p_parent_id: null,
      p_target_id: null,
      p_target_label: null,
      p_mentions: [],
    });
    expect(step.error?.message).toBe("invalid_step");
  });

  it("notifie la personne mentionnée et renvoie son courriel", async () => {
    const { data, error } = await add(member, "Qu'en pensez-vous, @Proprio ?", {
      target: "facteur-1",
      label: "Facteur : inflation",
      mentions: [userIds[0], userIds[2]],
    });
    expect(error).toBeNull();
    const result = data as AddResult;
    rootId = result.id;
    // La personne extérieure est ignorée : seule la propriétaire est mentionnée
    expect(result.emails).toEqual([emails[0]]);

    const [mention] = await notifications(owner);
    expect(mention).toMatchObject({ kind: "mention", comment_id: rootId, read_at: null });
    const unread = await owner.rpc("strategy_unread_notifications");
    expect(unread.data).toBe(1);
    expect(await notifications(stranger)).toEqual([]);

    const [comment] = await comments(owner);
    expect(comment.mentions).toEqual([userIds[0]]);
  });

  it("n'envoie pas de courriel à qui l'a désactivé", async () => {
    const off = await owner
      .from("profiles")
      .update({ notify_email: false })
      .eq("id", userIds[0]);
    expect(off.error).toBeNull();
    const { data } = await add(member, "Et maintenant, @Proprio ?", { mentions: [userIds[0]] });
    expect((data as AddResult).emails).toEqual([]);
    await owner.from("profiles").update({ notify_email: true }).eq("id", userIds[0]);
  });

  it("notifie une réponse une seule fois, même à la responsable de l'étape", async () => {
    const { data, error } = await add(owner, "Bonne question.", { parent: rootId });
    expect(error).toBeNull();
    const replyId = (data as AddResult).id;
    const received = (await notifications(member)).filter((n) => n.comment_id === replyId);
    expect(received.map((n) => n.kind)).toEqual(["reply"]);

    const nested = await add(member, "Réponse à la réponse", { parent: replyId });
    expect(nested.error?.message).toBe("invalid_parent");
  });

  it("notifie la responsable de l'étape d'un nouveau fil", async () => {
    const { data } = await add(owner, "Pensez aux taux d'intérêt.");
    const id = (data as AddResult).id;
    const received = (await notifications(member)).filter((n) => n.comment_id === id);
    expect(received.map((n) => n.kind)).toEqual(["step_comment"]);
  });

  it("ne laisse modifier que son propre commentaire", async () => {
    const refused = await owner.rpc("strategy_edit_comment", {
      p_comment_id: rootId,
      p_body: "Modifié par une autre",
    });
    expect(refused.error?.message).toBe("not_author");
    const edited = await member.rpc("strategy_edit_comment", {
      p_comment_id: rootId,
      p_body: "Qu'en pensez-vous ?",
    });
    expect(edited.error).toBeNull();
    const root = (await comments(member)).find((c) => c.id === rootId);
    expect(root?.body).toBe("Qu'en pensez-vous ?");
    expect(root?.edited_at).not.toBeNull();
  });

  it("résout puis rouvre un fil (auteur ou propriétaire)", async () => {
    const stray = await stranger.rpc("strategy_resolve_thread", {
      p_comment_id: rootId,
      p_resolved: true,
    });
    expect(stray.error?.message).toBe("comment_not_found");
    const resolved = await member.rpc("strategy_resolve_thread", {
      p_comment_id: rootId,
      p_resolved: true,
    });
    expect(resolved.error).toBeNull();
    expect((await comments(owner)).find((c) => c.id === rootId)?.resolved_at).not.toBeNull();
    await owner.rpc("strategy_resolve_thread", { p_comment_id: rootId, p_resolved: false });
    expect((await comments(owner)).find((c) => c.id === rootId)?.resolved_at).toBeNull();
  });

  it("garde le fil quand sa racine est supprimée, sans son texte", async () => {
    const { error } = await owner.rpc("strategy_delete_comment", { p_comment_id: rootId });
    expect(error).toBeNull();
    const root = (await comments(member)).find((c) => c.id === rootId);
    expect(root).toMatchObject({ deleted: true, body: "", mentions: [] });
    const left = (await notifications(owner)).filter((n) => n.comment_id === rootId);
    expect(left).toEqual([]);
  });

  it("n'expose ni les notifications ni les mentions en accès direct", async () => {
    const direct = await member.from("notifications").select("id");
    expect(direct.data ?? []).toEqual([]);
    const mentions = await member.from("study_comment_mentions").select("comment_id");
    expect(mentions.data ?? []).toEqual([]);
    const insert = await member.from("study_comments").insert({
      study_id: studyId,
      step_no: 1,
      author_id: userIds[1],
      body: "Contournement",
    });
    expect(insert.error).not.toBeNull();
  });

  it("marque toutes les notifications comme lues et consigne le journal", async () => {
    const done = await member.rpc("strategy_mark_notifications_read", { p_ids: null });
    expect(done.error).toBeNull();
    const unread = await member.rpc("strategy_unread_notifications");
    expect(unread.data).toBe(0);

    const { data } = await owner.rpc("strategy_study_activity", { p_study_id: studyId });
    expect((data as { action: string }[]).some((row) => row.action === "comment_added"))
      .toBe(true);
  });
});
