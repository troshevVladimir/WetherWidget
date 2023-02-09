<template>
  <div class="place">
    <h3 class="place__title">{{ location.title }}</h3>
    <span class="place__temp">
      Now temperature is: {{ location.data.temp }} &#8451;</span
    >
    <span class="place__data">
      Feels like: {{ location.data.feels_like }} &#8451;</span
    >
    <span></span>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import type { PropType } from "vue";
import { Place } from "@/App.ce.vue";

export default defineComponent({
  props: {
    location: {
      type: Object as PropType<Place>,
      required: true,
    },
  },
});
</script>
