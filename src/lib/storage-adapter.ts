/**
 * Storage adapter — routes all storage calls to the correct backend.
 *
 * Set STORAGE_BACKEND=supabase in .env.local to use Supabase.
 * Default (unset or "local") uses file-based storage in tmp/db/.
 */

const useSupabase = process.env.STORAGE_BACKEND === "supabase";

// Dynamic re-export based on env var
const backend = useSupabase
  ? require("./storage-supabase")
  : require("./storage");

export const getSummaries: typeof import("./storage").getSummaries = backend.getSummaries;
export const addSummary: typeof import("./storage").addSummary = backend.addSummary;

export const getAlerts: typeof import("./storage").getAlerts = backend.getAlerts;
export const addAlert: typeof import("./storage").addAlert = backend.addAlert;
export const acknowledgeAlert: typeof import("./storage").acknowledgeAlert = backend.acknowledgeAlert;

export const getProfile: typeof import("./storage").getProfile = backend.getProfile;
export const updateProfile: typeof import("./storage").updateProfile = backend.updateProfile;

export const savePendingCall: typeof import("./storage").savePendingCall = backend.savePendingCall;
export const getPendingCall: typeof import("./storage").getPendingCall = backend.getPendingCall;
export const deletePendingCall: typeof import("./storage").deletePendingCall = backend.deletePendingCall;
