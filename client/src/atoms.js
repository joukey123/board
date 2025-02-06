import { atom } from "recoil";

export const editingMode = atom({
  key: "editingMode",
  default: false,
});

export const postList = atom({
  key: "postList",
  default: [],
});

export const postSelect = atom({
  key: "postSelect",
  default: null,
});
