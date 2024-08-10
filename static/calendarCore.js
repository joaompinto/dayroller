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
    currentMonth = new Date().getMonth() + 1;
    
    updatePlanHeaderControls(defaultInstructionText);
    attachButtonListeners();

    generateCalendarRows(currentYear, currentMonth);

    $('.table-body').on('scroll', checkScroll);

    // Prevent context menu on right-click
    $('#calendarBody').on('contextmenu', function(e) {
        e.preventDefault();
    });

    // Add this new function call
    setTimeout(scrollToCurrentDay, 500);
});

function updatePlanHeaderControls(content) {
    $('#planHeaderControls').html(content);
}

function attachButtonListeners() {
    $('#selectButton').off('click').on('click', toggleSelectMode);
    $('#createEventBtn').off('click').on('click', handleCreateEvent);
}



function scrollToCurrentDay() {
    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();

    const currentDayRow = $(`#calendarBody tr[data-year="${currentYear}"][data-month="${getMonthName(currentMonth)}"][data-day="${currentDay}"]`);

    if (currentDayRow.length) {
        const scrollableDiv = $('.table-body');
        const tableHeaderHeight = $('.table-header').outerHeight();
        const rowOffset = currentDayRow.offset().top - scrollableDiv.offset().top;
        const scrollTop = rowOffset - tableHeaderHeight;

        // Scroll to the calculated position
        scrollableDiv.scrollTop(scrollTop);

        // Apply the disabled-like style to past days including today
        applyDisabledStyleToPastDays(currentYear, currentMonth, currentDay);
    } else {
        console.log("Current day row not found");
    }
}

function applyDisabledStyleToPastDays(currentYear, currentMonth, currentDay) {
    $('#calendarBody tr').each(function() {
        const rowYear = $(this).attr('data-year');
        const rowMonth = getMonthNumber($(this).attr('data-month'));
        const rowDay = $(this).attr('data-day');

        // Check if the date is in the past (including today)
        if (
            rowYear < currentYear ||
            (rowYear == currentYear && rowMonth < currentMonth) ||
            (rowYear == currentYear && rowMonth == currentMonth && rowDay <= currentDay)
        ) {
            // Apply a disabled-like color style and add a 'disabled-day' class
            $(this).css('color', '#B0B0B0').addClass('disabled-day'); // Light gray color to indicate disabled state
        }
    });
}

function getMonthNumber(monthName) {
    const months = {
        'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4, 'May': 5, 'Jun': 6,
        'Jul': 7, 'Aug': 8, 'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dec': 12
    };
    return months[monthName];
}

function getMonthName(monthNumber) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[monthNumber - 1];
}


function generateCalendarRows(year, month) {
    const calendarBody = $('#calendarBody');
    const date = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0).getDate();

    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    $('#headerYear').text(year);

    for (let day = 1; day <= lastDay; day++) {
        date.setDate(day);
        const dayOfWeek = date.getDay();
        const row = $('<tr>')
            .addClass('calendar-row')
            .attr('data-year', year)
            .attr('data-month', months[month - 1])
            .attr('data-day', day);
        
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            row.addClass('weekend');
        }
        
        const dateCell = $('<td>')
            .html(`${(day + '').padStart(2, '0')} ${months[month - 1]} <span class="weekday">${weekdays[dayOfWeek]}</span>`)
            .addClass('date-cell');

        row.append(dateCell);
        row.append($('<td>').addClass('plan-cell'));

        calendarBody.append(row);
    }

    console.log(`Generated rows for ${year}-${month}`); // Debugging line
}

function checkScroll() {
    const scrollableDiv = $('.table-body');
    const lastRow = $('#calendarBody tr:last-child');
    
    if (lastRow.length && isVisible(lastRow, scrollableDiv)) {
        // Commented out to prevent automatic loading of next month
        loadNextMonth();
    }
    
    const firstVisibleRow = logVisibleRows();
    if (firstVisibleRow) {
        const yearAttr = firstVisibleRow.attr('data-year');
        if (yearAttr && yearAttr !== $('#headerYear').text()) {
            $('#headerYear').text(yearAttr);
        }
    }
}

function loadNextMonth() {
    currentMonth++;
    if (currentMonth > 12) {
        currentMonth = 1;
        currentYear++;
    }
    generateCalendarRows(currentYear, currentMonth);
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

// Export functions and variables that need to be accessed by eventHandlers.js
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
    lastDayInstructionText,
    updatePlanHeaderControls,
    attachButtonListeners,
    generateCalendarRows
    // ... (include other functions you want to make accessible)
};