import VueRouter from 'vue-router'



import  pages from "./pages"


function getRoutes(targets=[]){
    var routes =[]
    targets = (targets.length==0) ? pages : targets
    targets.map(p => {
      routes.push({
        path: '/' + p,
        name: p,
        component: ()=>import('pages/' + p).then(m => m.default)
      })
    })
    return new VueRouter({routes})
}



export default getRoutes