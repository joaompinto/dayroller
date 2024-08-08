function generateCalendarRows(year, month, categoryCount) {
    const calendarBody = $('#calendarBody');
    const date = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0).getDate();

    // Check if this month has already been generated
    const existingRows = calendarBody.find(`tr[data-year="${year}"][data-month="${month}"]`);
    if (existingRows.length > 0) {
        return; // This month has already been generated, so we exit the function
    }

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

        // Add cells for existing categories
        for (let i = 0; i < categoryCount; i++) {
            row.append($('<td>'));
        }

        calendarBody.append(row);
    }
}
