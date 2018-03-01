const template =
    `<div class='node-label' :style="style">
          <header>{{title}}</header>
          <p>{{summary}}</p>
    </div>`;

Vue.component("node-label", {
    template: template,

    props: ["top", "left", "title", "summary"],

    data: function () {
        return {}
    },

    computed: {
        style: function () {
            return ""
                + "top:" + this.top + "px;"
                + "left:" + (this.left + 10) + "px;";
        }
    }
});