import Vue from 'vue'
import App from './App.vue'

import 'plugins/element.js'
import 'assets/theme/index.css'
import ElementUI from 'element-ui'
Vue.use(ElementUI)

import VueRouter from 'vue-router'
Vue.use(VueRouter)
import router from 'routes/router'

import {
  message
} from 'utils/resetMessage'
Vue.prototype.$message = message

Vue.config.productionTip = false




new Vue({
  render: h => h(App),
  router:router()
}).$mount('#app')
