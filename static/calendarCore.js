// calendarCore.js

let currentYear, currentMonth;
let selectedRows = new Set();
let isSelectMode = false;
let selectionState = 'none';
let firstSelectedIndex = -1;
let lastSelectedIndex = -1;

const neutralColors = [
    '#8E44AD', '#34495E', '#16A085', '#F39C12', '#7F8C8D', '#D35400', '#2C3E50'
];

const defaultInstructionText = '<button id="selectButton">Create Event</button>';
const selectModeInstructionText = "Click on the first day for your event";
const lastDayInstructionText = "Click the last day of your event";

$(document).ready(function() {
    currentYear = new Date().getFullYear();
    currentMonth = new Date().getMonth() + 1; // 1-12
    
    updatePlanHeaderControls(defaultInstructionText);
    attachButtonListeners();

    generateCalendarRows(currentYear, currentMonth);
    loadEventsFromStorage();

    $('.table-body').on('scroll', checkScroll);

    // Prevent context menu on right-click
    $('#calendarBody').on('contextmenu', function(e) {
        e.preventDefault();
    });

    setTimeout(scrollToCurrentDay, 500);

    // Populate year picker
    const yearPicker = document.getElementById('yearPicker');
    for (let y = currentYear - 10; y <= currentYear + 10; y++) {
        const option = document.createElement('option');
        option.value = y;
        option.textContent = y;
        yearPicker.appendChild(option);
    }
    yearPicker.value = currentYear;

    // Set up year/month picker modal
    const headerYearButton = document.getElementById('headerYearButton');
    const yearMonthModal = document.getElementById('yearMonthModal');
    const closeModal = document.getElementsByClassName('close')[0];
    const applyYearMonth = document.getElementById('applyYearMonth');

    headerYearButton.textContent = currentYear;
    headerYearButton.addEventListener('click', function() {
        yearMonthModal.style.display = 'block';
    });

    closeModal.addEventListener('click', function() {
        yearMonthModal.style.display = 'none';
    });

    window.addEventListener('click', function(event) {
        if (event.target == yearMonthModal) {
            yearMonthModal.style.display = 'none';
        }
    });

    applyYearMonth.addEventListener('click', function() {
        const selectedYear = parseInt(yearPicker.value);
        const selectedMonth = parseInt(document.getElementById('monthPicker').value) + 1; // 1-12
        currentYear = selectedYear;
        currentMonth = selectedMonth;
        headerYearButton.textContent = currentYear;
        yearMonthModal.style.display = 'none';
        generateCalendarRows(currentYear, currentMonth);
        loadEventsFromStorage();
    });
});

function updatePlanHeaderControls(content) {
    $('#planHeaderControls').html(content);
}

function attachButtonListeners() {
    $('#selectButton').off('click').on('click', toggleSelectMode);
    $('#createEventBtn').off('click').on('click', handleCreateEvent);
}

function generateCalendarRows(year, month) {
    const calendarBody = $('#calendarBody');
    calendarBody.empty(); // Clear existing rows

    const date = new Date(year, month - 1, 1);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    $('#headerYearButton').text(year);

    const today = new Date();
    const startDay = (year === today.getFullYear() && month === today.getMonth() + 1) ? today.getDate() - 1 : 1;

    let firstMonth = monthNames[month - 1];
    let lastMonth = firstMonth;

    for (let m = 0; m < 3; m++) { // Loop through the current month and the next two months
        const currentMonth = (month + m - 1) % 12;
        const currentYear = year + Math.floor((month + m - 1) / 12);
        const lastDay = new Date(currentYear, currentMonth + 1, 0).getDate();

        if (m === 2) {
            lastMonth = monthNames[currentMonth];
        }

        for (let day = (m === 0 ? startDay : 1); day <= lastDay; day++) {
            date.setFullYear(currentYear);
            date.setMonth(currentMonth);
            date.setDate(day);
            const dayOfWeek = date.getDay();
            const row = $('<tr>')
                .addClass('calendar-row')
                .attr('data-year', currentYear)
                .attr('data-month', monthNames[currentMonth])
                .attr('data-day', day);

            if (dayOfWeek === 0 || dayOfWeek === 6) {
                row.addClass('weekend');
            }

            const dateCell = $('<td>')
                .html(`${(day + '').padStart(2, '0')} ${monthNames[currentMonth]} <span class="weekday">${weekdays[dayOfWeek]}</span>`)
                .addClass('date-cell');

            const planCell = $('<td>').addClass('plan-cell');

            row.append(dateCell);
            row.append(planCell);

            calendarBody.append(row);
        }
    }

    $('#headerMonths').text(`${firstMonth} - ${lastMonth}`);

    console.log(`Generated rows for ${year}-${month} and the next two months`);
}

function loadEventsFromStorage() {
    const events = JSON.parse(localStorage.getItem('calendarEvents')) || [];
    events.forEach(event => {
        addEventToCalendar(event);
    });
}

function addEventToCalendar(event) {
    const startDate = new Date(event.startDate);
    const endDate = new Date(event.endDate);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const row = $(`#calendarBody tr[data-year="${d.getFullYear()}"][data-month="${monthNames[d.getMonth()]}"][data-day="${d.getDate()}"]`);
        if (row.length) {
            const eventElement = createEventElement(event);
            row.find('.plan-cell').append(eventElement);
        }
    }
}

function createEventElement(event) {
    return $('<button>')
        .addClass('plan-category-element')
        .text(event.name)
        .css('background-color', event.color)
        .data('event', event)
        .attr('data-has-details', event.details ? 'true' : 'false');
}

function changeMonth(delta) {
    currentMonth += delta;
    if (currentMonth > 12) {
        currentMonth = 1;
        currentYear++;
    } else if (currentMonth < 1) {
        currentMonth = 12;
        currentYear--;
    }
    generateCalendarRows(currentYear, currentMonth);
    loadEventsFromStorage();
}

function scrollToCurrentDay() {
    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();

    const currentDayRow = $(`#calendarBody tr[data-year="${currentYear}"][data-month="${getMonthName(currentMonth - 1)}"][data-day="${currentDay}"]`);

    if (currentDayRow.length) {
        const scrollableDiv = $('.table-body');
        const tableHeaderHeight = $('.table-header').outerHeight();
        const rowOffset = currentDayRow.offset().top - scrollableDiv.offset().top;
        const scrollTop = rowOffset - tableHeaderHeight;

        scrollableDiv.scrollTop(scrollTop);
    } else {
        console.log("Current day row not found");
    }
}

function getMonthNumber(monthName) {
    const months = {
        'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
        'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
    };
    return months[monthName] !== undefined ? months[monthName] : -1;
}

function getMonthName(monthNumber) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[monthNumber];
}

function checkScroll() {
    const scrollableDiv = $('.table-body');
    const lastRow = $('#calendarBody tr:last-child');
    
    if (lastRow.length && isVisible(lastRow, scrollableDiv)) {
        // Commented out to prevent automatic loading of next month
        // loadNextMonth();
    }
    
    const firstVisibleRow = logVisibleRows();
    if (firstVisibleRow) {
        const yearAttr = firstVisibleRow.attr('data-year');
        if (yearAttr && yearAttr !== $('#headerYear').text()) {
            $('#headerYear').text(yearAttr);
        }
    }
}

function isVisible(row, container) {
    var elementTop = $(row).offset().top,
        elementHeight = $(row).height(),
        containerTop = container.offset().top,
        containerHeight = container.height();

    return ((elementTop - containerTop + elementHeight) > 0) && ((elementTop - containerTop) < containerHeight);
}

function logVisibleRows() {
    const rows = $('#calendarBody tr');
    const visibleRows = [];
    const scrollableDiv = $('.table-body');
    const scrollTop = scrollableDiv.scrollTop();
    const viewportHeight = scrollableDiv.height();

    rows.each(function() {
        const $row = $(this);
        const rowTop = $row.position().top - scrollTop;
        const rowBottom = rowTop + $row.outerHeight();

        if (rowTop >= 0 && rowTop < viewportHeight || rowBottom > 0 && rowBottom <= viewportHeight) {
            visibleRows.push(this);
        }
    });

    if (visibleRows.length > 0) {
        const firstVisibleRow = $(visibleRows[0]);
        const lastVisibleRow = $(visibleRows[visibleRows.length - 1]);

        console.log('Visible rows:', visibleRows.length);
        console.log('First visible row:', firstVisibleRow.find('.date-cell').text());
        console.log('Last visible row:', lastVisibleRow.find('.date-cell').text());

        return firstVisibleRow;
    } else {
        console.log('No visible rows');
        return null;
    }
}

// Make sure to expose necessary functions to the global scope
window.generateCalendarRows = generateCalendarRows;
window.loadEventsFromStorage = loadEventsFromStorage;
window.addEventToCalendar = addEventToCalendar;
window.changeMonth = changeMonth;
window.updatePlanHeaderControls = updatePlanHeaderControls;
window.attachButtonListeners = attachButtonListeners;

// Expose variables that need to be accessed by eventHandlers.js
window.calendarCore = {
    currentYear,
    currentMonth,
    selectedRows,
    isSelectMode,
    selectionState,
    firstSelectedIndex,
    lastSelectedIndex,
    neutralColors,
    defaultInstructionText,
    selectModeInstructionText,
    lastDayInstructionText
};

document.addEventListener('DOMContentLoaded', function() {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const headerMonths = document.getElementById('headerMonths');
    headerMonths.innerHTML = `${months[0]} - ${months[months.length - 1]}`;
});