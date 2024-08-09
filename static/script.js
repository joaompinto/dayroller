let currentYear, currentMonth;
let categoryCount = 0;
let selectedRows = new Set();
let isMouseDown = false;
let startRowIndex = -1;
let lastSelectedIndex = -1;
let isEditMode = false;

function toggleEditMode() {
    isEditMode = !isEditMode;
    const calendarHeader = $('.calendar-header');
    const editModeBtn = $('#editModeBtn');

    if (isEditMode) {
        calendarHeader.show();
        editModeBtn.text('Read');
    } else {
        calendarHeader.hide();
        editModeBtn.text('Edit');
    }
}

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
    '#E63946', '#F4A261', '#FFD166', '#2A9D8F', '#48CAE4', '#3D5A80', '#9D4EDD'
];

function getContrastingTextColor(backgroundColor) {
    let r, g, b;

    if (backgroundColor.startsWith('rgb')) {
        [r, g, b] = backgroundColor.match(/\d+/g).map(Number);
    } else if (backgroundColor.startsWith('#')) {
        if (backgroundColor.length === 7) {
            [r, g, b] = [1, 3, 5].map(offset => parseInt(backgroundColor.slice(offset, offset + 2), 16));
        } else if (backgroundColor.length === 9) {
            [r, g, b] = [1, 3, 5].map(offset => parseInt(backgroundColor.slice(offset, offset + 2), 16));
        }
    } else {
        throw new Error('Unsupported color format');
    }

    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? 'black' : 'white';
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
            .attr('data-month', months[month - 1]);
        
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
    
    if (e.shiftKey && lastSelectedIndex !== -1) {
        selectRowsBetween(lastSelectedIndex, rowIndex);
    } else if (e.ctrlKey || e.metaKey) {
        toggleRowSelection(rowIndex);
    } else {
        if (selectedRows.size === 1 && rowIndex > lastSelectedIndex) {
            // If only one row is selected and clicking below it, select all rows in between
            selectRowsBetween(lastSelectedIndex, rowIndex);
        } else {
            // In all other cases, select only the clicked row
            selectSingleRow(rowIndex);
        }
    }
    
    updateSelectionInfo();
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

function toggleRowSelection(index) {
    const row = $('#calendarBody tr').eq(index);
    row.toggleClass('selected-row');
    if (selectedRows.has(index)) {
        selectedRows.delete(index);
    } else {
        selectedRows.add(index);
        lastSelectedIndex = index;
    }
}

function selectSingleRow(index) {
    $('#calendarBody tr').removeClass('selected-row');
    selectedRows.clear();
    const row = $('#calendarBody tr').eq(index);
    row.addClass('selected-row');
    selectedRows.add(index);
    lastSelectedIndex = index;
}

function handleMouseEnter(e) {
    if (!isMouseDown) return;
    
    const row = $(e.currentTarget);
    const rowIndex = row.index();
    
    selectRowsBetween(lastSelectedIndex, rowIndex);
    updateSelectionInfo();
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
    currentYear = new Date().getFullYear();
    currentMonth = new Date().getMonth() + 1;
    
    generateCalendarRows(currentYear, currentMonth);

    $('#editModeBtn').on('click', toggleEditMode);

    $('.table-body').on('scroll', checkScroll);
    $('#addCategoryBtn').on('click', addCategory);

    $('#calendarBody')
        .on('mousedown', 'tr', handleRowClick)
        .on('mouseenter', 'tr', handleMouseEnter);

    $(document).on('mouseup', handleMouseUp);

    $('#calendarBody').on('contextmenu', function(e) {
        e.preventDefault();
    });

    $(document).on('click', '.category-button', handleCategoryClick);
});

function handleCategoryClick(e) {
    e.preventDefault();
    
    const categoryButton = $(e.currentTarget);
    const buttonColor = categoryButton.css('background-color');
    const textColor = getContrastingTextColor(buttonColor);
    const categoryName = categoryButton.text();
    
    const value = prompt(`Enter the value for the "${categoryName}" category (or "-" to remove):`);
    
    if (value !== null) {
        if (value === '-') {
            $('#calendarBody tr').each(function() {
                $(this).find(`.plan-category-element[data-category="${categoryName}"]`).remove();
            });
            
            categoryButton.remove();
            categoryCount--;
        } else {
            selectedRows.forEach(rowIndex => {
                const row = $('#calendarBody tr').eq(rowIndex);
                const planCell = row.find('td.plan-cell');
                
                const existingCategory = planCell.find(`.plan-category-element[data-category="${categoryName}"]`);
                if (existingCategory.length) {
                    if (value.trim() === '') {
                        existingCategory.remove();
                    } else {
                        existingCategory.text(value);
                    }
                } else if (value.trim() !== '') {
                    planCell.append(`<div class="plan-category-element" data-category="${categoryName}" style="background-color: ${buttonColor}; color: ${textColor};">${value}</div>`);
                }
                
                row.addClass('selected-row');
            });
        }
        
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
        infoText += ` (<strong>${weekendCount}</strong> weekend days)`;
    }

    const categoryCounts = countCategories();
    if (Object.keys(categoryCounts).length > 0) {
        infoText += " |";
        for (const [category, categoryCount] of Object.entries(categoryCounts)) {
            infoText += ` ${category} (<strong>${categoryCount}</strong>),`;
        }
        infoText = infoText.slice(0, -1);
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