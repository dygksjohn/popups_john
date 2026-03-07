const VALID_ADMIN_STATUSES = new Set(["active", "ended", "pending"]);

export const readAdminStatus = (status) => {
  const normalized = String(status ?? "").trim().toLowerCase();
  return VALID_ADMIN_STATUSES.has(normalized) ? normalized : null;
};

export const resolveAdminStatus = (item, fallbackStatus) =>
  readAdminStatus(item?.status) || fallbackStatus;

export const countAdminStatuses = (items = []) =>
  (Array.isArray(items) ? items : []).reduce(
    (counts, item) => {
      const status = readAdminStatus(item?.status);
      counts.all += 1;
      if (status) counts[status] += 1;
      return counts;
    },
    { all: 0, active: 0, ended: 0, pending: 0 },
  );
