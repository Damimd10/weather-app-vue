import { createApp } from "vue";
import HighchartsVue from "highcharts-vue";
import App from "./App.vue";

const app = createApp(App);

// @ts-ignore
app.use(HighchartsVue);

app.mount("#app");
