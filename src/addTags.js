import Vue from 'vue'
import App from 'view/pages/AddTags.vue'

import 'plugins/element.js'
import 'assets/theme/index.css'
import ElementUI from 'element-ui'
Vue.use(ElementUI)


import {
    message
} from 'utils/resetMessage'
Vue.prototype.$message = message

Vue.config.productionTip = false




new Vue({
    render: h => h(App)
}).$mount('#app')
