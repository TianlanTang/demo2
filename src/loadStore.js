// import { create } from "zustand";
// import { oneTileHerringBoneStore } from "./TileStores/oneTileHerringBoneStore";
// import { oneTileHorizontalStore } from "./TileStores/oneTileHorizontalStore";

// const horizontal = [
//     "Grid",
//     "Horizontal With Horizontal Offset W/Lratio 2:1",
//     "Horizontal With Horizontal Offset W/Lratio 1.5:1",
//     "Horizontal With Horizontal Offset W/Lratio 1:1",
//     "Vertical With Horizontal Offset W/Lratio 1:2",
//     "Vertical With Horizontal Offset W/Lratio 1:1.5",
//     "Vertical With Horizontal Offset W/Lratio 1:6", 
// ];

// export const LoadStore = create((set, get) => ({

//     activeStore: oneTileHorizontalStore,
//     setStore: (store) => {
//         if (horizontal.includes(store)) {
//             set({ activeStore: oneTileHorizontalStore })
//         } else {
//             set({ activeStore: oneTileHerringBoneStore })
//         }
//         get().activeStore.getState().init();
//         console.log("Store changed to: ", store);
//     },
// }));