const container = document.getElementById("jsoneditor")
const options = {
    modes: ['code', 'tree'],
    colorPicker: true,
    templates: [
        {
            text: 'Timezone',
            title: 'Insert a timezone',
            value: {
                timezone: 'UTC',
                label: 'Me',
                color: '#ff0000',
                imageUrl: '',
            }

        },

    ],
    onChange: () => {
        localStorage.setItem('timezones', JSON.stringify(editor.get()));
        update();
    },
}
const editor = new JSONEditor(container, options);
editor.set(JSON.parse(localStorage.getItem('timezones') || '[]'))