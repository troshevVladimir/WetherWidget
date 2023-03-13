import WetherWidget from "./App.ce.vue";
import { defineCustomElement } from "vue";

const WetherWidgetElement = defineCustomElement(WetherWidget);

customElements.define("wether-widget", WetherWidgetElement);
