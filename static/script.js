let currentYear, currentMonth;
let selectedRows = new Set();
let isSelectMode = false;
let selectionState = 'none';
let firstSelectedIndex = -1;
let lastSelectedIndex = -1;

const neutralColors = [
    '#8E44AD', '#34495E', '#16A085', '#F39C12', '#7F8C8D', '#D35400', '#2C3E50'
];

const defaultInstructionText = '<span>Scroll or</span> <button id="selectButton">Create Event</button>';
const selectModeInstructionText = "Click on the first day for your event";
const lastDayInstructionText = "Click the last day of your event";

$(document).ready(function() {
    currentYear = new Date().getFullYear();
    currentMonth = new Date().getMonth() + 1;
    
    updateInstructions(defaultInstructionText);
    attachButtonListeners();

    generateCalendarRows(currentYear, currentMonth);

    $('#editModeBtn').on('click', toggleEditMode);

    $('.table-body').on('scroll', checkScroll);

    // Prevent context menu on right-click
    $('#calendarBody').on('contextmenu', function(e) {
        e.preventDefault();
    });

    $(document).on('click', '.plan-category-element', handlePlanElementClick);

    // Add this new function call
    setTimeout(scrollToCurrentDay, 500);
});

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


function updateInstructions(content) {
    $('.calendar-header-instructions').html(`
        <div class="instruction-container">
            ${content}
        </div>
    `);
}

function attachButtonListeners() {
    $('#selectButton').off('click').on('click', toggleSelectMode);
    $('#createEventBtn').off('click').on('click', handleCreateEvent);
}

function toggleEditMode() {
    isEditMode = !isEditMode;
    const editModeBtn = $('#editModeBtn');

    if (isEditMode) {
        editModeBtn.text('Read');
    } else {
        editModeBtn.text('Edit');
    }
}

function handlePlanElementClick(e) {
    e.stopPropagation();
    e.preventDefault();
    
    const button = $(e.currentTarget);
    const name = button.text();
    const color = button.css('background-color');
    const details = button.data('details') || '';
    
    showEventEditModal(button, name, color, details);
}

function toggleSelectMode() {
    isSelectMode = !isSelectMode;
    selectionState = 'none';
    clearSelection();
    
    if (isSelectMode) {
        updateInstructions(selectModeInstructionText);
        startSelectionMode();
        hideDisabledDays();  // Hide disabled days when select mode is active
    } else {
        updateInstructions(defaultInstructionText);
        endSelectionMode();
        showDisabledDays();  // Show disabled days when exiting select mode
    }
    attachButtonListeners();
    logSelectState();
}

function startSelectionMode() {
    $('#calendarBody').off('click', 'tr').on('click', 'tr', handleRowClick);
    console.log("Selection mode started - Row click listeners attached");
}

function endSelectionMode() {
    $('#calendarBody').off('click', 'tr');
    console.log("Selection mode ended - Row click listeners removed");
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

// Modify the checkScroll function to prevent automatic loading of next month
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

// Add this function to your script
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

function handleRowClick(e) {
    if (!isSelectMode || $(e.target).hasClass('plan-category-element')) return;
    
    console.log("handleRowClick called", new Date().getTime());
    
    const row = $(e.currentTarget);
    const rowIndex = row.index();

    console.log(`Row clicked: ${rowIndex}`);

    switch (selectionState) {
        case 'none':
            clearSelection();
            selectSingleRow(rowIndex);
            firstSelectedIndex = rowIndex;
            selectionState = 'first';
            updateInstructions(lastDayInstructionText);
            break;
        case 'first':
            lastSelectedIndex = rowIndex;
            selectRowsBetween(firstSelectedIndex, lastSelectedIndex);
            selectionState = 'complete';
            updateInstructions(formatSelectionInfo());
            attachButtonListeners();
            break;
        case 'complete':
            clearSelection();
            selectSingleRow(rowIndex);
            firstSelectedIndex = rowIndex;
            lastSelectedIndex = -1;
            selectionState = 'first';
            updateInstructions(lastDayInstructionText);
            break;
    }
    logSelectState();
}

function formatSelectionInfo() {
    const count = selectedRows.size;
    if (count === 0) {
        return defaultInstructionText;
    }

    let weekendCount = 0;
    selectedRows.forEach(rowIndex => {
        const row = $('#calendarBody tr').eq(rowIndex);
        if (row.hasClass('weekend')) {
            weekendCount++;
        }
    });

    let infoText = `<strong>${count}</strong> day${count !== 1 ? 's' : ''}`;
    if (weekendCount > 0) {
        infoText += ` (<strong>${weekendCount}</strong> weekend day${weekendCount !== 1 ? 's' : ''})`;
    }

    return `<button id="createEventBtn">Create Event</button> for ${infoText}`;
}

function selectSingleRow(index) {
    $('#calendarBody tr').removeClass('selected-row');
    selectedRows.clear();
    const row = $('#calendarBody tr').eq(index);
    row.addClass('selected-row');
    selectedRows.add(index);
    lastSelectedIndex = index;
}

function selectRowsBetween(start, end) {
    const minIndex = Math.min(start, end);
    const maxIndex = Math.max(start, end);
    
    $('#calendarBody tr').each(function(index) {
        if (index >= minIndex && index <= maxIndex) {
            $(this).addClass('selected-row');
            selectedRows.add(index);
        } else {
            $(this).removeClass('selected-row');
            selectedRows.delete(index);
        }
    });
    
    lastSelectedIndex = end;
}

function handleCreateEvent() {
    console.log("Create event clicked");
    isSelectMode = false;
    
    const colorSelectionHTML = generateColorSelectionHTML();
    updateInstructions(colorSelectionHTML);
    attachColorSelectionListeners();
}

function generateColorSelectionHTML() {
    let html = '<div class="color-selection">';
    html += '<span class="color-selection-text">Select event color: </span>';
    html += '<div class="color-button-container">';
    neutralColors.forEach((color, index) => {
        html += `<button class="color-button" style="background-color: ${color};" data-color="${color}"></button>`;
    });
    html += '</div></div>';
    return html;
}

function attachColorSelectionListeners() {
    $('.color-button').on('click', function() {
        const selectedColor = $(this).data('color');
        console.log(`Selected color: ${selectedColor}`);
        showEventNameInput(selectedColor);
    });
}

function showEventNameInput(selectedColor) {
    const inputHTML = `
        <div class="event-name-input">
            <input type="text" id="eventNameInput" placeholder="Enter event name">
            <button id="createEventBtn" style="background-color: ${selectedColor};">Create</button>
        </div>
    `;
    updateInstructions(inputHTML);
    
    $('#eventNameInput').focus();
    
    attachEventNameInputListeners(selectedColor);
}

function attachEventNameInputListeners(selectedColor) {
    $('#createEventBtn').on('click', function() {
        const eventName = $('#eventNameInput').val().trim();
        if (eventName) {
            createEventWithColorAndName(selectedColor, eventName);
        } else {
            alert('Please enter an event name');
        }
    });

    $('#eventNameInput').on('keypress', function(e) {
        if (e.which === 13) {
            $('#createEventBtn').click();
        }
    });
}

function createEventWithColorAndName(color, name) {
    console.log(`Creating event: ${name} with color: ${color}`);
    
    // Create the event element
    const eventElement = $('<button>')
        .addClass('plan-category-element')
        .text(name)
        .css('background-color', color)
        .data('category', name)
        .data('details', '')
        .attr('data-has-details', 'false');

    // Add the event to each selected row
    selectedRows.forEach(rowIndex => {
        const row = $('#calendarBody tr').eq(rowIndex);
        const planCell = row.find('.plan-cell');
        planCell.append(eventElement.clone());
    });

    // Reset selection and state
    clearSelection();
    isSelectMode = false;
    selectionState = 'none';
    updateInstructions(defaultInstructionText);
    attachButtonListeners();
    logSelectState();
}

function clearSelection() {
    $('.calendar-row').removeClass('selected-row');
    selectedRows.clear();
    firstSelectedIndex = -1;
    lastSelectedIndex = -1;
    console.log("Selection cleared");
}

function logSelectState() {
    console.log(`Select Mode: ${isSelectMode}, Selection State: ${selectionState}, First Index: ${firstSelectedIndex}, Last Index: ${lastSelectedIndex}`);
}

function handlePlanElementClick(e) {
    e.stopPropagation();
    const button = $(e.currentTarget);
    const name = button.text();
    const color = button.css('background-color');
    const details = button.data('details') || '';
    
    showEventEditModal(button, name, color, details);
}

function showEventEditModal(button, name, color, details) {
    const modalHTML = `
        <div class="event-modal">
            <h3>Edit Event</h3>
            <input type="text" id="editEventName" value="${name}" placeholder="Event name">
            <textarea id="editEventDetails" placeholder="Event details">${details}</textarea>
            <div class="modal-buttons">
                <button id="saveEventChanges">Save</button>
                <button id="cancelEventChanges">Cancel</button>
                <button id="deleteEvent">Delete</button>
            </div>
        </div>
    `;

    $('body').append(modalHTML);
    
    const modal = $('.event-modal');
    modal.css('display', 'block');

    $('#saveEventChanges').on('click', function() {
        const newName = $('#editEventName').val().trim();
        const newDetails = $('#editEventDetails').val().trim();
        
        if (newName) {
            button.text(newName);
            button.data('details', newDetails);
            button.attr('data-has-details', newDetails !== '' ? 'true' : 'false');
        }
        modal.remove();
    });

    $('#cancelEventChanges').on('click', function() {
        modal.remove();
    });

    $('#deleteEvent').on('click', function() {
        if (confirm('Are you sure you want to delete this event?')) {
            button.remove();
            modal.remove();
        }
    });
}

function hideDisabledDays() {
    $('#calendarBody tr.disabled-day').hide();
}

function showDisabledDays() {
    $('#calendarBody tr.disabled-day').show();
}
