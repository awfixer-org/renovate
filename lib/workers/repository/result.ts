import type { RenovateConfig } from '../../config/types';

import type {
  EXTERNAL_HOST_ERROR,
  MANAGER_LOCKFILE_ERROR,
  NO_VULNERABILITY_ALERTS,
  PLATFORM_AUTHENTICATION_ERROR,
  PLATFORM_BAD_CREDENTIALS,
  PLATFORM_INTEGRATION_UNAUTHORIZED,
  PLATFORM_RATE_LIMIT_EXCEEDED,
  REPOSITORY_CANNOT_FORK,
  REPOSITORY_CHANGED,
  REPOSITORY_FORK_MISSING,
  SYSTEM_INSUFFICIENT_DISK_SPACE,
  SYSTEM_INSUFFICIENT_MEMORY,
  TEMPORARY_ERROR,
  UNKNOWN_ERROR,
} from '../../constants/error-messages';
import {
  CONFIG_SECRETS_EXPOSED,
  CONFIG_VALIDATION,
  MISSING_API_CREDENTIALS,
  REPOSITORY_ACCESS_FORBIDDEN,
  REPOSITORY_ARCHIVED,
  REPOSITORY_BLOCKED,
  REPOSITORY_CLOSED_ONBOARDING,
  REPOSITORY_DISABLED,
  REPOSITORY_DISABLED_BY_CONFIG,
  REPOSITORY_EMPTY,
  REPOSITORY_FORKED,
  REPOSITORY_FORK_MODE_FORKED,
  REPOSITORY_MIRRORED,
  REPOSITORY_NOT_FOUND,
  REPOSITORY_NO_CONFIG,
  REPOSITORY_NO_PACKAGE_FILES,
  REPOSITORY_RENAMED,
  REPOSITORY_UNINITIATED,
} from '../../constants/error-messages';
import { logger } from '../../logger';

export type ProcessStatus =
  | 'disabled'
  | 'onboarded'
  | 'activated'
  | 'onboarding'
  | 'unknown';

export interface ProcessResult {
  res: RepositoryResult;
  status: ProcessStatus;
  enabled: boolean | undefined;
  onboarded: boolean | undefined;
}

/** a strong type for any repository result status that Renovate may report */
export type RepositoryResult =
  // repository was processed successfully
  | 'done'
  // Renovate performed branch-based automerge on one branch during its run
  | 'automerged'
  // Repository Errors - causes repo to be considered as disabled
  | typeof REPOSITORY_UNINITIATED
  | typeof REPOSITORY_EMPTY
  | typeof REPOSITORY_CLOSED_ONBOARDING
  | typeof REPOSITORY_DISABLED
  | typeof REPOSITORY_DISABLED_BY_CONFIG
  | typeof REPOSITORY_NO_CONFIG
  | typeof REPOSITORY_ARCHIVED
  | typeof REPOSITORY_MIRRORED
  | typeof REPOSITORY_RENAMED
  | typeof REPOSITORY_BLOCKED
  | typeof REPOSITORY_ACCESS_FORBIDDEN
  | typeof REPOSITORY_NOT_FOUND
  | typeof REPOSITORY_FORK_MODE_FORKED
  | typeof REPOSITORY_FORKED
  | typeof REPOSITORY_CANNOT_FORK
  | typeof REPOSITORY_FORK_MISSING
  | typeof REPOSITORY_NO_PACKAGE_FILES
  // temporary errors
  | typeof NO_VULNERABILITY_ALERTS
  | typeof REPOSITORY_CHANGED
  | typeof TEMPORARY_ERROR
  // Config Error
  | typeof CONFIG_VALIDATION
  | typeof MISSING_API_CREDENTIALS
  | typeof CONFIG_SECRETS_EXPOSED
  // system errors
  | typeof SYSTEM_INSUFFICIENT_DISK_SPACE
  | typeof SYSTEM_INSUFFICIENT_MEMORY
  // host errors
  | typeof EXTERNAL_HOST_ERROR
  // platform errors
  | typeof PLATFORM_RATE_LIMIT_EXCEEDED
  | typeof PLATFORM_BAD_CREDENTIALS
  | typeof PLATFORM_INTEGRATION_UNAUTHORIZED
  | typeof PLATFORM_AUTHENTICATION_ERROR
  // other errors
  | typeof MANAGER_LOCKFILE_ERROR
  | typeof UNKNOWN_ERROR;

export function processResult(
  config: RenovateConfig,
  res: RepositoryResult,
): ProcessResult {
  const disabledStatuses = [
    REPOSITORY_ACCESS_FORBIDDEN,
    REPOSITORY_ARCHIVED,
    REPOSITORY_BLOCKED,
    REPOSITORY_CLOSED_ONBOARDING,
    REPOSITORY_DISABLED,
    REPOSITORY_DISABLED_BY_CONFIG,
    REPOSITORY_EMPTY,
    REPOSITORY_FORK_MODE_FORKED,
    REPOSITORY_FORKED,
    REPOSITORY_MIRRORED,
    REPOSITORY_NOT_FOUND,
    REPOSITORY_NO_CONFIG,
    REPOSITORY_NO_PACKAGE_FILES,
    REPOSITORY_RENAMED,
    REPOSITORY_UNINITIATED,
  ];
  const enabledStatuses = [
    CONFIG_SECRETS_EXPOSED,
    CONFIG_VALIDATION,
    MISSING_API_CREDENTIALS,
  ];
  let status: ProcessStatus;
  let enabled: boolean | undefined;
  let onboarded: boolean | undefined;
  // istanbul ignore next
  if (disabledStatuses.includes(res)) {
    status = 'disabled';
    enabled = false;
  } else if (config.repoIsActivated) {
    status = 'activated';
    enabled = true;
    onboarded = true;
  } else if (enabledStatuses.includes(res) || config.repoIsOnboarded) {
    status = 'onboarded';
    enabled = true;
    onboarded = true;
  } else if (config.repoIsOnboarded === false) {
    status = 'onboarding';
    enabled = true;
    onboarded = false;
  } else {
    logger.debug(`Unknown res: ${res}`);
    status = 'unknown';
  }
  logger.debug(
    // TODO: types (#22198)
    `Repository result: ${res}, status: ${status}, enabled: ${enabled!}, onboarded: ${onboarded!}`,
  );
  return { res, status, enabled, onboarded };
}
