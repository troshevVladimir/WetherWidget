<template>
  <div class="settings">
    <div v-show="isFetching">fetch data...</div>
    <h2 class="settings__title">Settings</h2>
    <transition-group name="list" tag="ul" class="settings__locations" ref="ul">
      <li
        :title="location.title"
        class="settings__locations-item"
        v-for="location in localLocations"
        :key="location.title"
        ref="items"
        draggable="true"
        @dragover.prevent="dragoverHandler($event, location.title)"
        @dragenter.prevent
        @dragleave="dragleaveHandler"
        @dragstart="dragStartHandler(location.title)"
        @drop="dropHandler($event, location.title)"
      >
        <svg-icon
          class="settings__locations-grab"
          type="mdi"
          :path="mdiDrag"
        ></svg-icon>

        <span class="settings__locations-title">{{ location.title }}</span>
        <svg-icon
          class="settings__locations-trash"
          type="mdi"
          :path="mdiTrashCanOutline"
          @click="deleteLocation(location.id)"
        ></svg-icon>
      </li>
    </transition-group>
    <div class="settings__input-wrapper">
      <p>Enter new location name</p>
      <p class="settings__input-error" v-show="error">{{ error }}</p>
      <input
        class="settings__input"
        type="text"
        @keyup.enter="addNewLocation"
        @input="error = ''"
      />
      <svg-icon type="mdi" :path="mdiKeyboardReturn"></svg-icon>
    </div>
  </div>
</template>
<script lang="ts">
import SvgIcon from "@jamescoyle/vue-icon";
import { mdiKeyboardReturn, mdiTrashCanOutline, mdiDrag } from "@mdi/js";
import { defineComponent } from "vue";
import type { PropType } from "vue";
import { Place } from "@/App.ce.vue";
import { tsFetch } from "@/assets/helpers";
import { Coordinates, getWether } from "@/assets/helpers";

export interface Data {
  display_name: string;
  class: string;
  icon: string;
}

declare interface BaseComponentData {
  [key: string]: any;
  selectedItemTitle: string | null;
}

export type Response = Array<object & Data>;

export default defineComponent({
  emits: {
    ["update:locations"](payload: Place[]) {
      return payload;
    },
  },
  props: {
    locations: {
      type: Array as PropType<Place[]>,
      default: () => [],
    },
  },
  components: {
    SvgIcon,
  },
  data(): BaseComponentData {
    return {
      mdiKeyboardReturn,
      mdiTrashCanOutline,
      mdiDrag,
      error: "",
      places: [],
      selectedItemTitle: null,
      isFetching: false,
      localLocations: this.locations,
    };
  },

  mounted() {
    const items = this.$refs.items as HTMLInputElement[];
    if (!this.$refs.items || !items.length) return;
    items.forEach((item) => {
      item.addEventListener(`dragstart`, (e: DragEvent) => {
        (e.target as HTMLInputElement).classList.add(`dragged`);
      });

      item.addEventListener(`dragend`, (e: DragEvent) => {
        (e.target as HTMLInputElement).classList.remove(`dragged`);
      });
    });
  },

  methods: {
    dragoverHandler(e: DragEvent, title: string) {
      if (!title || title === this.selectedItemTitle) return;

      (e.target as HTMLInputElement)
        ?.closest(".settings__locations-item")
        ?.classList.add("dragover");
    },

    dragStartHandler(title: string) {
      this.selectedItemTitle = title;
    },

    dropHandler(e: DragEvent, title: string) {
      console.log(title);

      const nowOverElement = (e.target as HTMLInputElement)?.closest(
        ".settings__locations-item"
      );
      const nowOverElementTitle = nowOverElement?.getAttribute("title");
      const nowOverElementIndex = this.localLocations.findIndex(
        (el: Place) => el.title === nowOverElementTitle
      );
      const currentItem = this.localLocations.find(
        (el: Place) => el.title === this.selectedItemTitle
      );

      this.localLocations = this.localLocations.filter((el: Place) => {
        return el.title !== this.selectedItemTitle;
      });

      this.localLocations.splice(nowOverElementIndex, 0, currentItem);

      nowOverElement?.classList.remove("dragover");
      this.selectedItemTitle = null;
      this.$emit("update:locations", this.localLocations);
    },

    dragleaveHandler(e: DragEvent) {
      (e.target as HTMLInputElement)
        ?.closest(".settings__locations-item")
        ?.classList.remove("dragover");
    },
    async addNewLocation(event: KeyboardEvent): Promise<undefined> {
      let target = event.target as HTMLInputElement;
      let newValue = target?.value;
      if (!newValue) {
        this.error = "Empty value is not allowed";
        return;
      }

      if (this.locations.findIndex((el: Place) => el.title === newValue) + 1) {
        this.error = "This value already exists. Try another";
        return;
      }

      this.isFetching = true;
      const urlNominatim: URL = new URL(
        "https://nominatim.openstreetmap.org/search"
      );
      urlNominatim.searchParams.append("format", "json");
      urlNominatim.searchParams.append("limit", "1");
      urlNominatim.searchParams.append("q", newValue);
      let coordinatesNewPlace: Coordinates;
      (event.target as HTMLInputElement).value = "";
      try {
        const location: Array<{ lon: number; lat: number }> = await tsFetch(
          urlNominatim.toString()
        );

        if (!location.length)
          this.error = `Not found place with name ${newValue}. Try another`;

        coordinatesNewPlace = {
          longitude: location[0].lon,
          latitude: location[0].lat,
        };
      } catch ({ message }) {
        throw new Error("Проблема в nominatim " + message);
      } finally {
        this.isFetching = false;
      }
      try {
        const wether = await getWether(coordinatesNewPlace);

        const alreadyExist =
          this.localLocations.findIndex(
            (el: Place) => el.title === wether.title
          ) + 1;

        if (!alreadyExist) {
          this.localLocations.push(wether);
        } else {
          this.error = "This value already exists. Try another";
          return;
        }
        this.$emit("update:locations", this.localLocations);
      } catch ({ message }) {
        throw new Error("Проблема в openweathermap " + message);
      } finally {
        this.isFetching = false;
      }
    },
    deleteLocation(id: number) {
      this.localLocations = this.localLocations.filter(
        (el: Place) => el.id !== id
      );
      this.$emit("update:locations", this.localLocations);
    },
  },
});
</script>
