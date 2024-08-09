let currentYear, currentMonth;
let categoryCount = 0;
let selectedRows = new Set();
let isMouseDown = false;
let startRowIndex = -1;
let lastSelectedIndex = -1;

function updateLineCount() {
    const rowCount = $('#calendarBody tr').length;
    $('#lineCount').text(rowCount);
}

function isVisible(row, container) {
    var elementTop = $(row).offset().top,
        elementHeight = $(row).height(),
        containerTop = $('.table-body').offset().top,
        containerHeight = $('.table-body').height();

    return ((((elementTop - containerTop) + elementHeight) > 0) && ((elementTop - containerTop) < containerHeight));
}

function getVisibleRows() {
    const rows = $('#calendarBody tr');
    const visibleRows = [];

    rows.each(function() {
        if (isVisible(this, $('.table-body'))) {
            visibleRows.push(this);
        }
    });

    return visibleRows;
}

function logVisibleRows() {
    const visibleRows = getVisibleRows();
    
    if (visibleRows.length > 0) {
        const firstVisibleRow = $(visibleRows[0]);
        const lastVisibleRow = $(visibleRows[visibleRows.length - 1]);

        console.log('Visible rows:', visibleRows.length);
        console.log('First visible row:', firstVisibleRow.find('.date-header').text());
        console.log('Last visible row:', lastVisibleRow.find('.date-header').text());
    } else {
        console.log('No visible rows');
    }
}

const rainbowColors = [
    '#E63946', // Bright Red
    '#F4A261', // Light Orange
    '#FFD166', // Muted Yellow
    '#2A9D8F', // Teal Green
    '#48CAE4', // Sky Blue
    '#3D5A80', // Navy Blue
    '#9D4EDD'  // Lavender
];

function getContrastingTextColor(backgroundColor) {
    let r, g, b;

    if (backgroundColor.startsWith('rgb')) {
        // Extract RGB values from 'rgb(r, g, b)' format
        [r, g, b] = backgroundColor.match(/\d+/g).map(Number);
    } else if (backgroundColor.startsWith('#')) {
        // Convert hex to RGB
        if (backgroundColor.length === 7) { // '#RRGGBB'
            [r, g, b] = [1, 3, 5].map(offset => parseInt(backgroundColor.slice(offset, offset + 2), 16));
        } else if (backgroundColor.length === 9) { // '#RRGGBBAA'
            [r, g, b] = [1, 3, 5].map(offset => parseInt(backgroundColor.slice(offset, offset + 2), 16));
        }
    } else {
        throw new Error('Unsupported color format');
    }

    // Calculate luminance using the YIQ color space
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;

    // Return white text if the background is dark, otherwise return black
    return (yiq >= 128) ? 'black' : 'white';
}
function generateCalendarRows(year, month) {
    const calendarBody = $('#calendarBody');
    const date = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0).getDate();

    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let day = 1; day <= lastDay; day++) {
        date.setDate(day);
        const dayOfWeek = date.getDay();
        const row = $('<tr>')
            .addClass('calendar-row')
            .attr('data-year', year)
            .attr('data-month', month);
        
        // Add 'weekend' class for Saturday and Sunday
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            row.addClass('weekend');
        }
        
        const dateCell = $('<td>')
            .html(`${date.toLocaleDateString()} <span class="weekday">${weekdays[dayOfWeek]}</span>`)
            .addClass('date-cell'); // Apply class to date cells

        row.append(dateCell);

        // Add the "Plan" column cell
        row.append($('<td>').addClass('plan-cell'));


        calendarBody.append(row);
    }
}

function addCategory() {
    categoryCount++;
    const newCategoryName = prompt("Enter the name for the new category:");
    
    if (newCategoryName) {
        const colorIndex = (categoryCount - 1) % rainbowColors.length;
        const buttonColor = rainbowColors[colorIndex];
        const textColor = getContrastingTextColor(buttonColor);

        $('.category-list').append(`
            <button class="category-button" style="background-color: ${buttonColor}; color: ${textColor};">${newCategoryName}</button>
        `);
    }
}

function handleRowClick(e) {
    e.preventDefault();
    
    const row = $(e.currentTarget);
    const rowIndex = row.index();
    
    isMouseDown = true;
    
    if (e.shiftKey && lastSelectedIndex !== -1) {
        updateSelection(rowIndex, true, false);
    } else if (e.ctrlKey || e.metaKey) {
        updateSelection(rowIndex, false, true);
    } else {
        updateSelection(rowIndex, false, false);
    }
}

function updateSelection(endRowIndex, isShiftKey, isCtrlKey) {
    if (isShiftKey && lastSelectedIndex !== -1) {
        const start = Math.min(endRowIndex, lastSelectedIndex);
        const end = Math.max(endRowIndex, lastSelectedIndex);
        
        for (let i = start; i <= end; i++) {
            const currentRow = $('#calendarBody tr').eq(i);
            currentRow.addClass('selected-row');
            selectedRows.add(i);
        }
    } else if (isCtrlKey) {
        const row = $('#calendarBody tr').eq(endRowIndex);
        row.toggleClass('selected-row');
        if (selectedRows.has(endRowIndex)) {
            selectedRows.delete(endRowIndex);
        } else {
            selectedRows.add(endRowIndex);
        }
    } else {
        // Check if the clicked row is adjacent to the last selected row
        const isAdjacent = Math.abs(endRowIndex - lastSelectedIndex) === 1;
        
        if (isAdjacent && selectedRows.size > 0) {
            // Extend selection to include the adjacent row
            const row = $('#calendarBody tr').eq(endRowIndex);
            row.addClass('selected-row');
            selectedRows.add(endRowIndex);
        } else {
            // Reset selection and select only the new row
            $('#calendarBody tr').removeClass('selected-row');
            selectedRows.clear();
            const row = $('#calendarBody tr').eq(endRowIndex);
            row.addClass('selected-row');
            selectedRows.add(endRowIndex);
        }
    }
    
    lastSelectedIndex = endRowIndex;
    updateSelectionInfo();
}

// ... (rest of the code remains the same)

function handleMouseEnter(e) {
    if (!isMouseDown) return;
    
    const row = $(e.currentTarget);
    const rowIndex = row.index();
    
    updateSelection(rowIndex, true, false);
}

function handleMouseUp() {
    isMouseDown = false;
}


function loadNextMonth() {
    currentMonth++;
    if (currentMonth > 12) {
        currentMonth = 1;
        currentYear++;
    }
    generateCalendarRows(currentYear, currentMonth);
}

function checkScroll() {
    const scrollableDiv = $('.table-body');
    const lastRow = $('#calendarBody tr:last-child');
    
    if (lastRow.length && isVisible(lastRow, scrollableDiv)) {
        loadNextMonth();
    }
    
    logVisibleRows();
}

$(document).ready(function() {
    currentYear = year || new Date().getFullYear();
    currentMonth = month || new Date().getMonth() + 1;
    
    generateCalendarRows(currentYear, currentMonth, categoryCount);

    $('.table-body').on('scroll', checkScroll);
    $('#addCategoryBtn').on('click', addCategory);

    $('#calendarBody')
    .on('mousedown', 'tr', handleRowClick)
    .on('mouseenter', 'tr', handleMouseEnter);

    $(document)
        .on('mouseup', handleMouseUp);

    // Prevent context menu on the calendar body
    $('#calendarBody').on('contextmenu', function(e) {
        e.preventDefault();
    });

    // Attach event listener to category buttons
    $(document).on('click', '.category-button', handleCategoryClick);


});

// ... (previous code remains the same)

function handleCategoryClick(e) {
    e.preventDefault();
    
    const categoryButton = $(e.currentTarget);
    const buttonColor = categoryButton.css('background-color');
    const textColor = getContrastingTextColor(buttonColor);
    const categoryName = categoryButton.text();
    
    const value = prompt(`Enter the value for the "${categoryName}" category (or "-" to remove):`);
    
    if (value !== null) {
        if (value === '-') {
            // Remove the category from all rows
            $('#calendarBody tr').each(function() {
                $(this).find(`.plan-category-element[data-category="${categoryName}"]`).remove();
            });
            
            // Remove the category button
            categoryButton.remove();
            categoryCount--;
        } else {
            selectedRows.forEach(rowIndex => {
                const row = $('#calendarBody tr').eq(rowIndex);
                const planCell = row.find('td.plan-cell');
                
                // Check if this category already exists for this row
                const existingCategory = planCell.find(`.plan-category-element[data-category="${categoryName}"]`);
                if (existingCategory.length) {
                    if (value.trim() === '') {
                        // If the new value is empty, remove the existing category
                        existingCategory.remove();
                    } else {
                        // If it exists and the new value is not empty, update its text
                        existingCategory.text(value);
                    }
                } else if (value.trim() !== '') {
                    // If it doesn't exist and the value is not empty, add it
                    planCell.append(`<div class="plan-category-element" data-category="${categoryName}" style="background-color: ${buttonColor}; color: ${textColor};">${value}</div>`);
                }
                
                // Ensure the row remains selected
                row.addClass('selected-row');
            });
        }
        
        // Update the selection info
        updateSelectionInfo();
    }
}

function updateSelectionInfo() {
    const count = selectedRows.size;
    if (count === 0) {
        $('#selectionInfo').html("No days selected");
        return;
    }

    let weekendCount = 0;
    selectedRows.forEach(rowIndex => {
        const row = $('#calendarBody tr').eq(rowIndex);
        if (row.hasClass('weekend')) {
            weekendCount++;
        }
    });

    let infoText = `<strong>${count}</strong> day${count !== 1 ? 's' : ''} selected`;
    if (weekendCount > 0) {
        infoText += ` (incl. <strong>${weekendCount}</strong> weekend)`;
    }

    // Add category counts
    const categoryCounts = countCategories();
    if (Object.keys(categoryCounts).length > 0) {
        infoText += " | Categories:";
        for (const [category, categoryCount] of Object.entries(categoryCounts)) {
            infoText += ` ${category} (${categoryCount}),`;
        }
        infoText = infoText.slice(0, -1); // Remove the last comma
    }

    $('#selectionInfo').html(infoText);
}

function countCategories() {
    const categoryCounts = {};
    selectedRows.forEach(rowIndex => {
        const row = $('#calendarBody tr').eq(rowIndex);
        const planCell = row.find('td.plan-cell');
        planCell.find('.plan-category-element').each(function() {
            const category = $(this).data('category');
            categoryCounts[category] = (categoryCounts[category] || 0) + 1;
        });
    });
    return categoryCounts;
}