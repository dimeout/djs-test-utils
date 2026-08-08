// @ts-check

const resetters = new Set();

/**
 * @param {() => void} reset
 */
export function registerReset(reset) {
  resetters.add(reset);
}

export function resetAllMocks() {
  for (const reset of resetters) {
    reset();
  }
}

/**
 * @param {unknown} embed
 */
export function normalizeEmbed(embed) {
  if (embed && typeof embed === "object" && "toJSON" in embed) {
    const toJSON = /** @type {{ toJSON?: () => unknown }} */ (embed).toJSON;
    if (typeof toJSON === "function") {
      return normalizeEmbed(toJSON.call(embed));
    }
  }

  if (!embed || typeof embed !== "object") {
    return embed;
  }

  const source = /** @type {Record<string, unknown>} */ (embed);
  const fields = Array.isArray(source.fields)
    ? source.fields.map((field) => ({ ...field }))
    : source.fields;

  return {
    ...source,
    ...(fields === undefined ? {} : { fields }),
  };
}

/**
 * @param {string | Record<string, unknown>} content
 */
export function normalizePayload(content) {
  /** @type {Record<string, unknown>} */
  const payload = typeof content === "string" ? { content } : { ...content };
  if (Array.isArray(payload.embeds)) {
    payload.embeds = payload.embeds.map(normalizeEmbed);
  }
  if (payload.embed) {
    payload.embed = normalizeEmbed(payload.embed);
  }
  return payload;
}

/**
 * @param {unknown} error
 * @param {string} method
 */
export function createDiscordAPIError(error = {}, method = "GET") {
  if (error instanceof Error) {
    if (!("code" in error)) {
      Object.defineProperty(error, "code", {
        configurable: true,
        enumerable: true,
        value: 50035,
        writable: true,
      });
    }
    return error;
  }

  const config = /** @type {{ code?: number; message?: string; status?: number; url?: string; rawError?: unknown }} */ (
    error
  );
  const code = config.code ?? 50035;
  const apiError = new Error(
    config.message ?? `Mock Discord API error (${code})`,
  );
  apiError.name = "DiscordAPIError";
  Object.assign(apiError, {
    code,
    status: config.status ?? 400,
    method,
    url: config.url ?? "https://discord.com/api/mock",
    rawError: config.rawError ?? { code, message: apiError.message },
  });
  return apiError;
}

/**
 * @param {Record<string, unknown>} errors
 * @param {string} method
 */
export function maybeThrowConfiguredError(errors, method) {
  const error = errors[method] ?? errors.all;
  if (error) {
    throw createDiscordAPIError(error, method);
  }
}
