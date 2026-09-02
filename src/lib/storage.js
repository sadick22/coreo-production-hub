// Temporary localStorage-backed store. It mirrors the async shape of the
// artifact storage API the component was written against, so the component
// needs no changes when we swap this file's internals for Firebase later.
export const storage = {
  async get(key) {
    const value = localStorage.getItem(key);
    return value == null ? null : { value };
  },
  async set(key, value) {
    localStorage.setItem(key, value);
    return { value };
  },
};
