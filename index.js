
Vue.component('multiselect', VueMultiselect.default);

var vue = new Vue({
    el: '#app',
    data: {
        search: '',
        translations: { item: {} },
        currentItems: [],
        allItems: [],
        neededZones: [],
        noExtraData: true,
        loading: true
    },
    methods: {
        updateHash() {
            updateWindowHash();
        },
        copy() {
            var dt = new clipboard.DT();
            dt.setData('text/plain', window.location.href);
            clipboard.write(dt);
        }
    }
});

function formatData(data) {
    return _(data.regions)
        .map(({ name, subregions }) => {
            var regionName = name;

            return _.map(subregions, ({ name, location, level, abbrev, items, ir, areaLevel }) => {

                var regionInfo = { name, location, level, abbrev, ir, areaLevel };

                var sumName = name === regionName ? name : regionName + ' - ' + name;

                if(!items || items.length === 0) {
                    vue.neededZones.push(regionName + ' - ' + name);
                }

                return {
                    regionName: sumName  + ' ~ ' + 'Lv. ' + level,
                    itemInfo: _.sortBy(_.map(items || [], ({ name, level, source, events, coordinates }) => {
                        return {
                            name: name + ' ~ Lv. ' + level + ' (' + abbrev + ')',
                            data: {
                                name, level,
                                events: events || [], coordinates: coordinates || []
                            },
                            regionData: regionInfo
                        };
                    }), 'data.level')
                };

            });
        })
        .flattenDeep()
        .value();
}

function loadPreviousItems() {
    var loadItem = window.location.hash;
    if(!loadItem) return;

    var searchNames = decodeURIComponent(loadItem.substring(1)).split('|');

    if(!searchNames || !searchNames.length) return;

    searchNames.forEach(searchName => {
        var realSearchName = searchName
            .split('~')
            .join(' ~ ')
            .split('Lv')
            .join('Lv. ')
            .split('(')
            .join(' (');

        var itemObj = _(vue.allItems)
            .map('itemInfo')
            .flattenDeep()
            .filter(mon => _.includes(mon.name, realSearchName))
            .value();

        if(!itemObj || !itemObj.length) return;

        vue.currentItems.push(...itemObj);
    });

}

function updateWindowHash() {
    var allItems = vue.currentItems
        .map(x => x.name)
        .join('|');

    window.location.hash = '#' + encodeURIComponent(allItems);
}

function translationXMLToHash(xmlData) {
    var translations = {};

    _.each(xmlData.resource[0].message, ({ original, translation }) => {
        translations[translation[0]._text] = original[0]._text;
    });

    return translations;
}

function loadKey(key) {
    return JSON.parse(localStorage.getItem(key));
}

function saveKey(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

axios.get('items.yml')
    .then(res => {
        var allData = YAML.parse(res.data);
        vue.allItems = formatData(allData);
        console.log(allData);

        loadPreviousItems();
        vue.loading = false;
    });
