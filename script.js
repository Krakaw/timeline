// Constants
const timeline = document.getElementById("timeline");
const zones = {};
const times = {};
const defaultTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

// Variables
let overrideTime;
let currentTimezone = defaultTimezone;
let initialX = 0, offsetX = 0;
let initialTime;

// Event listeners
document.getElementById('centered-div').addEventListener('click', resetOverrideTime);
timeline.addEventListener('click', handleMarkerClick);
timeline.addEventListener('dragstart', handleDragStart);
timeline.addEventListener('drag', handleDrag);
timeline.addEventListener('dragend', handleDragEnd);

// Functions
function resetOverrideTime() {
    overrideTime = null;
    currentTimezone = defaultTimezone;
}

function addTick(time, minuteTick) {
    const d = document.createElement('div')
    d.className = 'timeline-marker ' + (minuteTick ? 'timeline-minute-tick' : 'timeline-hour-tick');

    d.style.left = calculatePosition(time) + "%";
    d.title = luxon.DateTime.fromMillis(+time).toFormat('HH:mm:ss');
    if (!minuteTick) {
        const l = document.createElement('div')
        l.className = 'timeline-tick-label';
        l.innerHTML = luxon.DateTime.fromMillis(+time).toFormat('HH');
        d.appendChild(l)
    }
    timeline.appendChild(d)
}

function addTime(timezone, labelText, color, imageUrl) {
    const luxonTime = overrideTime || luxon.DateTime.local();
    const currentTime = luxonTime.setZone(timezone)
    const tz = new Date();
    tz.setHours(currentTime.toFormat('H'), currentTime.toFormat('m'), currentTime.toFormat('s'), currentTime.toFormat('S'));
    const time = tz.getTime()



    if (times.hasOwnProperty(time) && zones[timezone]) {
        // If there are multiple timezones at the same time, then we need to adjust the position of the elements
        const { label} = zones[timezone];
        labelText = label.innerHTML + '<br>' + labelText;

    } else if (!zones[timezone]) {
        const elem = document.createElement('div')
        elem.className = 'timeline-marker';
        const img = document.createElement('div')
        img.setAttribute('draggable', true);
        img.setAttribute('data-timezone', timezone);

        img.className = 'timeline-marker-image';
        const uri = imageUrl || createLetterAvatar(labelText[0], color || generateRandomRGBColor(0.5), 100, 100);
        img.style.backgroundImage = 'url(' + uri + ')';
        img.style.backgroundSize = 'contain';
        img.style.backgroundRepeat = 'no-repeat';
        img.style.backgroundPosition = 'center';
        elem.appendChild(img)
        if (color) {
            elem.style.backgroundColor = color;
        }
        timeline.appendChild(elem)
        const label = document.createElement('div')
        label.className = 'timeline-label';
        zones[timezone] = {
            timezone,
            elem,
            label
        }
        if (!times[time]) {
            times[time] = zones[timezone];
        }
    }

    const {elem, label: labelElem} = zones[timezone];

    // If date is tomorrow then flag it as such
    if (currentTime.toFormat('d') > luxonTime.toFormat('d')) {
        labelText = labelText + ' (tomorrow)'
    } else if (currentTime.toFormat('d') < luxonTime.toFormat('d')) {
        labelText = labelText + ' (yesterday)'
    }

    elem.style.left = calculatePosition(time) + "%";
    labelElem.innerHTML = labelText + '<br>' + luxon.DateTime.fromMillis(+time).toFormat('HH:mm');
    elem.appendChild(labelElem)
}

function calculatePosition(time) {
    const start = new Date();
    start.setHours(0, 0, 0, 0); // Set start time to 00:00:00
    const end = new Date();
    end.setHours(23, 59, 59, 999); // Set end time to 23:59:59
    return (time - start.getTime()) / (end.getTime() - start.getTime()) * 100;
}

function addTicks() {
    for (let i = 0; i < 24; i++) {
        const d = new Date();
        d.setHours(i, 0, 0, 0);
        addTick(d.getTime());
        for (let j = 0; j < 60; j += 5) {
            const d = new Date();
            d.setHours(i, j, 0, 0);
            addTick(d.getTime(), true);
        }
    }
    const d = new Date();
    d.setHours(24, 0, 0, 0);
    addTick(d.getTime());
}

function updateLocalTime() {
    document.getElementById('localtime').innerHTML = (overrideTime || luxon.DateTime.local()).toFormat('HH:mm:ss');
    document.getElementById('label-value').innerText = currentTimezone;
    if (overrideTime) {
        // Add locked class to #centered-div
        document.getElementById('centered-div').classList.add('locked');
    } else {
        document.getElementById('centered-div').classList.remove('locked');
    }
}



function handleMarkerClick(e) {
    if (e.target.classList.contains('timeline-marker-image')) {
        overrideTime = luxon.DateTime.local().setZone(e.target.getAttribute('data-timezone'));
        currentTimezone = e.target.getAttribute('data-timezone');
    }
}

function handleDragStart(e) {
    initialX = e.clientX;
    offsetX = 0;
    currentTimezone = e.target.getAttribute('data-timezone');
    initialTime = overrideTime ? overrideTime.setZone(currentTimezone) : luxon.DateTime.local().setZone(currentTimezone);
    e.dataTransfer.setData('text', null); // For Firefox compatibility
    e.dataTransfer.setDragImage(new Image(), 0, 0);
}

function handleDrag(e) {
    if (e.clientX !== 0) { // Avoid the drag event where clientX is 0
        offsetX = e.clientX - initialX;
        handleDragEnd(e);
    }
}

function handleDragEnd(e) {
    const timelineRect = timeline.getBoundingClientRect();
    const percentageMoved = (offsetX / timelineRect.width) * 100;
    overrideTime = initialTime.plus({milliseconds: percentageMoved * (24 * 60 * 60 * 1000 / 100)});
}


function createLetterAvatar(letter, color, width, height) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    canvas.width = width;
    canvas.height = height;
  
    // Set background color
    context.fillStyle = color;
    context.fillRect(0, 0, canvas.width, canvas.height);
  
    // Set text properties
    context.font = 'bold ' + Math.floor(canvas.height / 2) + 'px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillStyle = 'white';
  
    // Draw the letter
    context.fillText(letter, canvas.width / 2, canvas.height / 2);
  
    return canvas.toDataURL();
  }
  
  function generateRandomRGBColor(opacity = 1) {
    const red = Math.floor(Math.random() * 256);
    const green = Math.floor(Math.random() * 256);
    const blue = Math.floor(Math.random() * 256);
    return `rgba(${red}, ${green}, ${blue}, ${opacity})`;
}


function update() {
    const timezones = JSON.parse(localStorage.getItem('timezones') || '[]');
 
    timezones.forEach(({ timezone, label, color, imageUrl }) => {
        addTime(timezone, label, color, imageUrl);
    });
    updateLocalTime()
    requestAnimationFrame(update)
}


function initialize() {
    const container = document.getElementById("jsoneditor")
    const toggleEditorButton = document.getElementById("toggle-editor");
    toggleEditorButton.addEventListener('click', function() {
        container.classList.toggle('visible');
    });
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
    
    // Initialization
    addTicks();
    requestAnimationFrame(update);
}

initialize();