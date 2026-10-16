/**
 * =============================================================
 *  Fichier    : member-list.tsx
 *  Projet     : Kalami Stratégie
 *  Description: Membres de l'étude sur la page Équipe (S9a) : nom, courriel, rôle et date
 *               d'arrivée. Le propriétaire change le rôle des autres membres et les retire ;
 *               un contributeur ou un observateur peut quitter l'étude. Chaque retrait est
 *               confirmé par un second clic.
 *  Auteur     : Claude Marcel
 *  Version    : 1.0
 *  Date       : 2026-10-15
 *  Dépendances: lib/strategy/team-actions.ts, lib/strategy/team.ts
 * =============================================================
 */

"use client";

import { useState, useTransition } from "react";

import { FormMessage } from "@/components/ui/form";
import { BADGE, BUTTON_SECONDARY, BUTTON_TERTIARY, CONTROL } from "@/components/ui/styles";
import { getDictionary, interpolate } from "@/i18n";
import type { FormState } from "@/lib/auth/actions";
import type { StudyRole } from "@/lib/strategy/steps";
import { INVITE_ROLES, memberLabel } from "@/lib/strategy/team";
import { removeMember, setMemberRole } from "@/lib/strategy/team-actions";
import type { StudyMember } from "@/lib/strategy/team-queries";

const s = getDictionary().strategy;
const tm = s.team;

const DATE_FORMAT = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" });

type MemberListProps = {
  studyId: string;
  members: StudyMember[];
  /** Utilisateur connecté et son rôle. */
  userId: string;
  role: StudyRole;
};

/** Liste des membres avec les actions permises à l'utilisateur connecté. */
export function MemberList({ studyId, members, userId, role }: MemberListProps) {
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState<string | null>(null);
  const [state, setState] = useState<FormState>(undefined);
  const isOwner = role === "owner";

  /**
   * Lance une action sur un membre et garde son résultat.
   * @param run - Action serveur à exécuter
   */
  function act(run: () => Promise<FormState>) {
    setConfirming(null);
    startTransition(async () => {
      setState(await run());
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col divide-y divide-line">
        {members.map((member) => {
          const self = member.user_id === userId;
          const name = memberLabel(member);
          const canRemove = member.role !== "owner" && (isOwner || self);
          return (
            <li key={member.user_id} className="flex flex-col gap-3 py-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <span className="flex min-w-0 flex-col gap-1">
                  <span className="font-medium">
                    {member.display_name ?? tm.members.noName}
                    {self && <span className="text-ink-muted"> ({tm.members.you})</span>}
                  </span>
                  <span className="break-all text-small text-ink-muted">{member.email}</span>
                  <span className="text-caption text-ink-muted">
                    {interpolate(tm.members.joined, {
                      date: DATE_FORMAT.format(new Date(member.joined_at)),
                    })}
                  </span>
                </span>
                {isOwner && member.role !== "owner" ? (
                  <select
                    aria-label={interpolate(tm.members.roleLabel, { name })}
                    value={member.role}
                    disabled={pending}
                    onChange={(event) =>
                      act(() => setMemberRole(studyId, member.user_id, event.target.value))}
                    className={`${CONTROL} sm:w-48`}
                  >
                    {INVITE_ROLES.map((value) => (
                      <option key={value} value={value}>{s.studies.roles[value]}</option>
                    ))}
                  </select>
                ) : (
                  <span className={`${BADGE} w-fit`}>{s.studies.roles[member.role]}</span>
                )}
              </div>
              {canRemove && (confirming === member.user_id ? (
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-small">
                    {self ? tm.members.leaveConfirm
                      : interpolate(tm.members.removeConfirm, { name })}
                  </span>
                  <button
                    type="button"
                    disabled={pending}
                    className={`${BUTTON_SECONDARY} border-danger text-danger`}
                    onClick={() => act(() => removeMember(studyId, member.user_id))}
                  >
                    {self ? tm.members.leave : tm.members.remove}
                  </button>
                  <button
                    type="button"
                    className={BUTTON_TERTIARY}
                    onClick={() => setConfirming(null)}
                  >
                    {tm.cancel}
                  </button>
                </span>
              ) : (
                <button
                  type="button"
                  disabled={pending}
                  className={`${BUTTON_TERTIARY} w-fit text-danger`}
                  onClick={() => setConfirming(member.user_id)}
                >
                  {self ? tm.members.leave : tm.members.remove}
                </button>
              ))}
            </li>
          );
        })}
      </ul>
      <FormMessage {...state} />
    </div>
  );
}
