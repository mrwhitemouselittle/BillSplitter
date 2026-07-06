import type { Participant } from '../types';

export function participantLabel(participantId: string, participants: Participant[]): string {
  return participants.find((participant) => participant.id === participantId)?.name ?? '未知参与人';
}
