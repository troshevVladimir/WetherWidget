<template>
  <div class="wether-widget">
    <div class="loader" v-show="isFetching">Fetching wether data...</div>
    <button class="wether-widget__button" @click="gearHandler">
      <svg-icon
        type="mdi"
        :path="showSettings ? mdiCog : mdiUndoVariant"
      ></svg-icon>
    </button>
    <template v-if="showSettings">
      <template v-if="Array.isArray(places) && places.length">
        <WetherPlace v-for="place in places" :location="place" :key="place" />
      </template>
      <div v-else-if="!isFetching">
        You need to add some places via settings
      </div>
    </template>
    <WetherSettings
      :locations="places"
      v-else
      @update:locations="locationsChangeHandler($event)"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import WetherPlace from "@/components/WetherPlace.vue";
import WetherSettings from "@/components/WetherSettings.vue";
import SvgIcon from "@jamescoyle/vue-icon";
import { mdiUndoVariant, mdiCog } from "@mdi/js";
import { Coordinates, getWether } from "@/assets/helpers";

interface Pos {
  coords: Coordinates;
}

export interface Place {
  title: string;
  data: ApiResp;
  readonly id: number;
  crd: Coordinates;
}

declare interface BaseComponentData {
  [key: string]: any;
  places: Place[];
  updateInterval: number | null;
}

interface ApiResp {
  [key: string]: any;
  feels_like: number;
  temp: number;
  temp_max: number;
  temp_min: number;
}

export default defineComponent({
  name: "App",
  components: {
    WetherPlace,
    WetherSettings,
    SvgIcon,
  },
  data(): BaseComponentData {
    return {
      places: [],
      isFetching: false,
      result: {} as ApiResp,
      showSettings: {},
      mdiCog,
      mdiUndoVariant,
      updateInterval: null,
    };
  },

  mounted() {
    this.updateInterval = setInterval(() => {
      this.refreshWether(this.places);
    }, 1000 * 60 * 60);

    function error(err: { code: number; message: string }) {
      console.warn(`ERROR(${err.code}): ${err.message}`);
    }

    const storageItemsString = localStorage.getItem("wetherWidget");
    const storageItems: Place[] | null = storageItemsString
      ? JSON.parse(storageItemsString)
      : null;

    if (storageItems) {
      this.places = storageItems;
      this.refreshWether(storageItems);
    } else {
      const options = {
        enableHighAccuracy: true,
      };

      const success = (pos: Pos) => {
        const crd = pos.coords;

        this.isFetching = true;
        getWether(crd)
          .then((response: Place) => {
            if (
              !(this.places.findIndex((el) => el.title === response.title) + 1)
            ) {
              this.locationsChangeHandler(response);
            }
          })
          .catch((e) => {
            console.error(e);
          })
          .finally(() => {
            this.isFetching = false;
          });
      };

      navigator.geolocation.getCurrentPosition(
        success.bind(this),
        error,
        options
      );
    }
  },
  beforeUnmount() {
    if (this.updateInterval) clearInterval(this.updateInterval);
  },
  methods: {
    refreshWether(items: Array<Place>) {
      const promises: Array<Promise<Place>> = [];
      items.forEach((item: Place) => {
        promises.push(getWether(item.crd).then((response: Place) => response));
        this.isFetching = true;
        Promise.all(promises)
          .then((response) => this.locationsChangeHandler(response))
          .catch((e) => {
            console.error(e);
          })
          .finally(() => {
            this.isFetching = false;
          });
      });
    },
    locationsChangeHandler(event: Array<Place> | Place) {
      if (event instanceof Array) this.places = event;
      else this.places = [event];

      localStorage.setItem("wetherWidget", JSON.stringify(this.places));
    },
    gearHandler() {
      this.showSettings = !this.showSettings;
    },
  },
});
</script>

<style lang="scss" src="./assets/style.scss" />
