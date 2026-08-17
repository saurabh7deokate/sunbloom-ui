import type { components } from './generated/schema';

/**
 * Readable aliases over the generated schema.
 *
 * `generated/schema.ts` is produced by `npm run generate:api` and must never be edited.
 * This file exists so components import `AuthResponse` rather than
 * `components['schemas']['AuthResponse']` — it renames, it never redefines. Adding a
 * hand-written interface here would reintroduce exactly the contract drift the
 * generation prevents (ADR-0007).
 */
export type AuthResponse = components['schemas']['AuthResponse'];
export type LoginRequest = components['schemas']['LoginRequest'];
export type RegisterRequest = components['schemas']['RegisterRequest'];
export type RefreshRequest = components['schemas']['RefreshRequest'];
export type UserResponse = components['schemas']['UserResponse'];

export type SkillTreeNode = components['schemas']['SkillTreeNode'];
export type SkillDetail = components['schemas']['SkillDetail'];
export type SkillSummary = components['schemas']['SkillSummary'];

export type SkillAdminView = components['schemas']['SkillAdminView'];
export type PendingReviewPage = components['schemas']['PendingReviewPage'];
export type ReviewDecisionRequest = components['schemas']['ReviewDecisionRequest'];

export type ValidationProblem = components['schemas']['HttpValidationProblemDetails'];
