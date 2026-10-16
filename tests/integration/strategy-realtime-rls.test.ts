/**
 * Fichier    : strategy-realtime-rls.test.ts
 * Projet     : Kalami Stratégie
 * Description: Tests d'intégration de la présence et du verrouillage doux (S9c) sur la base
 *              de développement : rôle lu depuis le sujet du canal ; canal Realtime privé
 *              ouvert aux seuls membres ; présence vue des autres membres ; diffusion
 *              réservée aux éditeurs ; deux membres qui enregistrent la même étape sans
 *              perte de données (copie de secours restaurable). Ignorés si les clés
 *              manquent ou si la migration 20261028120000 n'est pas encore appliquée.
 * Auteur     : Claude Marcel
 * Date       : 2026-10-16
 */

import {
  createClient,
  type RealtimeChannel,
  type SupabaseClient,
} from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const secretKey = process.env.SUPABASE_SECRET_KEY;
const enabled = Boolean(url && publishableKey && secretKey);

const NO_SESSION = { auth: { persistSession: false, autoRefreshToken: false } };
const RUN = crypto.randomUUID().slice(0, 8);
const WAIT_MS = 10_000;

const PROFILE = {
  sector: "Ébénisterie",
  employees: 40,
  revenueRange: "",
  foundedYear: 1998,
  countries: ["Canada"],
  cities: [],
  markets: [],
  teams: [],
  offers: ["Meubles sur mesure"],
  clients: [],
  competitors: ["Rival"],
};

/** Vrai si la migration S9c est appliquée (fonction strategy_topic_role présente). */
async function migrationApplied(): Promise<boolean> {
  if (!enabled) return false;
  const service = createClient(url!, secretKey!, NO_SESSION);
  const { error } = await service.rpc("strategy_topic_role", { p_topic: "study:x" });
  return !error || error.code !== "PGRST202";
}

const ready = await migrationApplied();

/** Attend une condition (sondage toutes les 100 ms) ; faux après le délai. */
async function waitFor(check: () => boolean, ms = WAIT_MS): Promise<boolean> {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    if (check()) return true;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  return check();
}

describe.skipIf(!ready)("RLS — présence et verrouillage doux (S9c)", () => {
  let service: SupabaseClient;
  let owner: SupabaseClient;
  let member: SupabaseClient;
  let observer: SupabaseClient;
  let stranger: SupabaseClient;
  const userIds: string[] = [];
  const channels: { client: SupabaseClient; channel: RealtimeChannel }[] = [];
  let studyId = "";

  /** Crée un utilisateur confirmé et retourne un client connecté. */
  async function signedInUser(label: string): Promise<SupabaseClient> {
    const email = `${label}-${RUN}@test.kalami.local`;
    const password = `Test-${crypto.randomUUID()}`;
    const created = await service.auth.admin.createUser({ email, password, email_confirm: true });
    if (created.error) throw created.error;
    userIds.push(created.data.user.id);
    const client = createClient(url!, publishableKey!, NO_SESSION);
    const signedIn = await client.auth.signInWithPassword({ email, password });
    if (signedIn.error) throw signedIn.error;
    await client.realtime.setAuth(signedIn.data.session.access_token);
    return client;
  }

  /**
   * Rejoint le canal privé de l'étude sur une connexion dédiée (un client ne peut pas
   * ouvrir deux fois le même canal).
   * @returns Le canal et son dernier statut (SUBSCRIBED si l'accès est accordé)
   */
  async function join(
    user: SupabaseClient,
    key: string,
    onSaved?: (payload: unknown) => void,
  ): Promise<{ channel: RealtimeChannel; status: () => string }> {
    let last = "";
    const { data } = await user.auth.getSession();
    const client = createClient(url!, publishableKey!, NO_SESSION);
    await client.realtime.setAuth(data.session!.access_token);
    const channel = client.channel(`study:${studyId}`, {
      config: { private: true, presence: { key, enabled: true } },
    });
    channel.on("broadcast", { event: "step-saved" }, ({ payload }) => onSaved?.(payload));
    channel.subscribe((status) => {
      last = status;
    });
    channels.push({ client, channel });
    await waitFor(() => last !== "" && last !== "CLOSED");
    return { channel, status: () => last };
  }

  /** Enregistre l'étape 1 sur une révision donnée. */
  function save(client: SupabaseClient, note: string, revision: number) {
    return client.rpc("strategy_save_step", {
      p_study_id: studyId,
      p_step_no: 1,
      p_payload: { factors: [], note },
      p_revision: revision,
    });
  }

  beforeAll(async () => {
    service = createClient(url!, secretKey!, NO_SESSION);
    owner = await signedInUser("presence-proprio");
    member = await signedInUser("presence-membre");
    observer = await signedInUser("presence-observateur");
    stranger = await signedInUser("presence-autre");

    const credit = await service
      .from("study_credits")
      .insert({ user_id: userIds[0], source: "admin_grant", note: `test ${RUN}` });
    if (credit.error) throw credit.error;
    const created = await owner.rpc("strategy_create_study", {
      p_company_name: `Présence ${RUN}`,
      p_strategic_question: "Faut-il croître ?",
    });
    if (created.error) throw created.error;
    studyId = created.data as string;

    const profile = await owner.rpc("strategy_save_profile", {
      p_study_id: studyId,
      p_company_name: `Présence ${RUN}`,
      p_strategic_question: "Faut-il croître ?",
      p_data: PROFILE,
    });
    if (profile.error) throw profile.error;

    const members = await service.from("study_members").insert([
      { study_id: studyId, user_id: userIds[1], role: "contributor" },
      { study_id: studyId, user_id: userIds[2], role: "observer" },
    ]);
    if (members.error) throw members.error;
  }, 60_000);

  afterAll(async () => {
    for (const { client, channel } of channels) {
      await client.removeChannel(channel);
      client.realtime.disconnect();
    }
    if (studyId) await service.from("studies").delete().eq("id", studyId);
    for (const id of userIds) await service.auth.admin.deleteUser(id);
  });

  it("lit le rôle depuis le sujet du canal", async () => {
    const topic = `study:${studyId}`;
    expect((await owner.rpc("strategy_topic_role", { p_topic: topic })).data).toBe("owner");
    expect((await observer.rpc("strategy_topic_role", { p_topic: topic })).data)
      .toBe("observer");
    expect((await stranger.rpc("strategy_topic_role", { p_topic: topic })).data).toBeNull();
    expect((await owner.rpc("strategy_topic_role", { p_topic: `x${topic}` })).data).toBeNull();
    expect((await owner.rpc("strategy_topic_role", { p_topic: "study:pas-un-uuid" })).data)
      .toBeNull();
  });

  it("ouvre le canal aux membres et le refuse aux autres", async () => {
    const ownerJoin = await join(owner, userIds[0]);
    expect(ownerJoin.status()).toBe("SUBSCRIBED");
    const strangerJoin = await join(stranger, userIds[3]);
    expect(strangerJoin.status()).not.toBe("SUBSCRIBED");
  }, 30_000);

  it("montre la présence d'un membre aux autres, observateur compris", async () => {
    const watcher = await join(observer, userIds[2]);
    expect(watcher.status()).toBe("SUBSCRIBED");
    const editor = await join(member, userIds[1]);
    expect(editor.status()).toBe("SUBSCRIBED");
    await editor.channel.track({
      userId: userIds[1],
      name: "Membre",
      stepNo: 1,
      elementId: "facteur-1",
    });

    const seen = await waitFor(() => userIds[1] in watcher.channel.presenceState());
    expect(seen).toBe(true);
    const [meta] = watcher.channel.presenceState()[userIds[1]] as unknown as
      { elementId: string }[];
    expect(meta.elementId).toBe("facteur-1");
  }, 30_000);

  it("réserve la diffusion aux éditeurs", async () => {
    const received: unknown[] = [];
    const listener = await join(owner, `${userIds[0]}-ecoute`, (payload) => {
      received.push(payload);
    });
    expect(listener.status()).toBe("SUBSCRIBED");

    const watcher = await join(observer, `${userIds[2]}-envoi`);
    await watcher.channel.send({
      type: "broadcast",
      event: "step-saved",
      payload: { from: "observer" },
    });
    const editor = await join(member, `${userIds[1]}-envoi`);
    await editor.channel.send({
      type: "broadcast",
      event: "step-saved",
      payload: { from: "member" },
    });

    expect(await waitFor(() => received.length > 0)).toBe(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    expect(received).toEqual([{ from: "member" }]);
  }, 40_000);

  it("garde la saisie du second membre quand deux membres enregistrent la même étape",
    async () => {
      const first = await save(owner, "propriétaire", 0);
      expect(first.error).toBeNull();
      expect(first.data).toBe(1);

      // Le membre travaillait encore sur la révision 0 : refus, rien n'est écrasé
      const second = await save(member, "membre", 0);
      expect(second.error?.message).toBe("revision_conflict");

      const copy = await member.rpc("strategy_save_conflict_copy", {
        p_study_id: studyId,
        p_step_no: 1,
        p_payload: { factors: [], note: "membre" },
      });
      expect(copy.error).toBeNull();
      expect(copy.data).toBe(true);

      // Copie rapprochée : ignorée
      const again = await member.rpc("strategy_save_conflict_copy", {
        p_study_id: studyId,
        p_step_no: 1,
        p_payload: { factors: [], note: "membre bis" },
      });
      expect(again.data).toBe(false);

      const { data: step } = await owner
        .from("study_steps")
        .select("payload, revision")
        .eq("study_id", studyId)
        .eq("step_no", 1)
        .single();
      expect(step).toMatchObject({ payload: { note: "propriétaire" }, revision: 1 });

      const { data: versions } = await owner
        .from("study_step_versions")
        .select("id, reason, payload")
        .eq("study_id", studyId)
        .eq("step_no", 1)
        .eq("reason", "conflict");
      expect(versions).toHaveLength(1);
      expect(versions?.[0].payload).toMatchObject({ note: "membre" });

      // Restaurer la copie garde d'abord la version du propriétaire
      const restored = await member.rpc("strategy_restore_version", {
        p_study_id: studyId,
        p_step_no: 1,
        p_version_id: versions?.[0].id,
        p_revision: 1,
      });
      expect(restored.error).toBeNull();
      const { data: kept } = await owner
        .from("study_step_versions")
        .select("payload")
        .eq("study_id", studyId)
        .eq("step_no", 1)
        .eq("reason", "auto");
      expect(kept?.some((v) => (v.payload as { note?: string }).note === "propriétaire"))
        .toBe(true);
    });

  it("refuse la copie de secours aux observateurs et aux personnes extérieures", async () => {
    for (const client of [observer, stranger]) {
      const { error } = await client.rpc("strategy_save_conflict_copy", {
        p_study_id: studyId,
        p_step_no: 1,
        p_payload: { factors: [] },
      });
      expect(error?.code).toBe("42501");
    }
  });
});
