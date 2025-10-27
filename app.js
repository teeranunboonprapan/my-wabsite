document.addEventListener('DOMContentLoaded', () => {
    const calendar = document.getElementById('calendar');
    const monthYear = document.getElementById('month-year');
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');
    const bookingList = document.getElementById('booking-list');

    const modal = document.getElementById('booking-modal');
    const modalTitle = document.getElementById('modal-title');
    const closeModalBtn = document.querySelector('.modal .close');
    const bookingForm = document.getElementById('booking-form');
    const bookingIdInput = document.getElementById('booking-id');
    const bookingDateInput = document.getElementById('booking-date');
    const searchForm = document.getElementById('search-form');
    const searchDateInput = document.getElementById('search-date');
    const resetSearchBtn = document.getElementById('reset-search');

    let currentDate = new Date();
    let bookings = [];

    const API_URL = '/api/bookings';

    // --- Functions ---

    async function fetchBookings() {
        try {
            const response = await fetch(API_URL);
            bookings = await response.json();
            renderCalendar();
            renderBookingList();
        } catch (error) {
            console.error('Error fetching bookings:', error);
        }
    }

    function renderCalendar() {
        calendar.innerHTML = '';
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        
        monthYear.textContent = `${currentDate.toLocaleString('th-TH', { month: 'long' })} ${year + 543}`;

        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // Add empty cells for days before the first of the month
        for (let i = 0; i < firstDayOfMonth; i++) {
            calendar.innerHTML += `<div class="date empty"></div>`;
        }

        // Add cells for each day of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const dateCell = document.createElement('div');
            dateCell.classList.add('date');
            dateCell.textContent = day;
            
            const thisDate = new Date(year, month, day);
            const today = new Date();
            today.setHours(0,0,0,0);

            if (thisDate.getTime() < today.getTime()) {
                 dateCell.classList.add('past');
            } else {
                const monthStr = String(month + 1).padStart(2, '0');
                const dayStr = String(day).padStart(2, '0');
                const dateString = `${year}-${monthStr}-${dayStr}`;
                dateCell.dataset.date = dateString;
                dateCell.addEventListener('click', () => openModal(dateCell.dataset.date));
            }

            if (thisDate.getTime() === today.getTime()) {
                dateCell.classList.add('today');
            }

            // FIX: Timezone bug and add deposit status check
            const bookingForDay = bookings.find(b => {
                const bookingDate = new Date(b.date);
                return bookingDate.getUTCFullYear() === year &&
                       bookingDate.getUTCMonth() === month &&
                       bookingDate.getUTCDate() === day;
            });

            if (bookingForDay) {
                dateCell.classList.add('booked');
                if (bookingForDay.depositStatus === 'มัดจำแล้ว') {
                    dateCell.classList.add('deposit-paid');
                }
            }
            
            calendar.appendChild(dateCell);
        }
    }

    function renderBookingList(filteredBookings = null) {
        bookingList.innerHTML = '';
        const listTitle = document.querySelector('#booking-list-container h2');
        
        // FIX: Timezone bug
        const bookingsToRender = filteredBookings || bookings.filter(b => {
            const bookingDate = new Date(b.date);
            return bookingDate.getUTCFullYear() === currentDate.getFullYear() && bookingDate.getUTCMonth() === currentDate.getMonth();
        });

        if (filteredBookings) {
            listTitle.textContent = `ผลการค้นหา (${bookingsToRender.length} รายการ)`;
        } else {
            listTitle.textContent = 'รายการจองเดือนนี้';
        }

        if (bookingsToRender.length === 0) {
            bookingList.innerHTML = '<p>ไม่พบรายการจอง</p>';
            return;
        }

        bookingsToRender.forEach(booking => {
            const item = document.createElement('div');
            item.classList.add('booking-item');
            let videoInfo = `<strong>ช่างวิดีโอ:</strong> ไม่มี`;
            if (booking.videographerCount > 0) {
                videoInfo = `<strong>ช่างวิดีโอ:</strong> ${booking.videographerCount} คน`;
            }
            let mapsLink = '';
            if (booking.googleMapsLink) {
                mapsLink = `<a href="${booking.googleMapsLink}" target="_blank">(ดูแผนที่)</a>`;
            }

            // ADD: Deposit status badge
            const depositPaidClass = booking.depositStatus === 'มัดจำแล้ว' ? 'deposit-paid-text' : '';
            const depositBadge = `<span class="deposit-badge ${depositPaidClass}">${booking.depositStatus}</span>`;

            item.innerHTML = `
                <strong>วันที่:</strong> ${new Date(booking.date).toLocaleDateString('th-TH')} ${depositBadge}<br>
                <strong>ชื่อ:</strong> ${booking.name} <br>
                <strong>สถานที่:</strong> ${booking.address} ${mapsLink} <br>
                <strong>ระยะเวลา:</strong> ${booking.duration || 'N/A'} <br>
                <strong>ราคา:</strong> ${booking.price || 'N/A'}<br>
                <strong>ช่างภาพ:</strong> ${booking.photographerCount} คน <br>
                ${videoInfo}
                <hr>
                <button onclick="openEditModal('${booking._id}')">แก้ไข</button>
                <button onclick="deleteBooking('${booking._id}')">ลบ</button>
            `;
            bookingList.appendChild(item);
        });
    }

    function openModal(date) {
        modal.style.display = 'block';
        modalTitle.textContent = 'จองคิว';
        bookingForm.reset();
        bookingIdInput.value = '';
        bookingDateInput.value = date;
    }

    window.openEditModal = function(id) {
        const booking = bookings.find(b => b._id === id);
        if (!booking) return;

        modal.style.display = 'block';
        modalTitle.textContent = 'แก้ไขข้อมูลการจอง';
        bookingIdInput.value = booking._id;
        bookingDateInput.value = new Date(booking.date).toISOString().split('T')[0];
        document.getElementById('name').value = booking.name;
        document.getElementById('address').value = booking.address;
        document.getElementById('duration').value = booking.duration || '';
        document.getElementById('google-maps-link').value = booking.googleMapsLink || '';
        document.getElementById('photographer-count').value = booking.photographerCount;
        document.getElementById('videographer-count').value = booking.videographerCount || '';
        document.getElementById('price').value = booking.price || '';
        // ADD: Set deposit status in edit modal
        document.getElementById('deposit-status').value = booking.depositStatus || 'ยังไม่จ่าย';
    }

    function closeModal() {
        modal.style.display = 'none';
    }

    async function handleFormSubmit(e) {
        e.preventDefault();
        const id = bookingIdInput.value;
        const videographerCount = parseInt(document.getElementById('videographer-count').value) || 0;
        const data = {
            date: bookingDateInput.value,
            name: document.getElementById('name').value,
            address: document.getElementById('address').value,
            duration: document.getElementById('duration').value,
            googleMapsLink: document.getElementById('google-maps-link').value,
            photographerCount: document.getElementById('photographer-count').value,
            videographerNeeded: videographerCount > 0,
            videographerCount: videographerCount,
            price: document.getElementById('price').value || '',
            // ADD: Get deposit status from form
            depositStatus: document.getElementById('deposit-status').value
        };

        const method = id ? 'PUT' : 'POST';
        const url = id ? `${API_URL}/${id}` : API_URL;

        try {
            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
            }
            
            closeModal();
            fetchBookings(); // Refresh data
        } catch (error) {
            console.error('Submit error:', error);
            alert(error.message);
        }
    }
    
    window.deleteBooking = async function(id) {
        if (!confirm('คุณต้องการลบรายการจองนี้ใช่หรือไม่?')) {
            return;
        }
        try {
            const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
            if (!response.ok) {
                throw new Error('เกิดข้อผิดพลาดในการลบข้อมูล');
            }
            fetchBookings(); // Refresh data
        } catch (error) {
            console.error('Delete error:', error);
            alert(error.message);
        }
    }


    // --- Event Listeners ---
    prevMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
        renderBookingList();
    });

    nextMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
        renderBookingList();
    });

    closeModalBtn.addEventListener('click', closeModal);
    window.addEventListener('click', (e) => {
        if (e.target == modal) {
            closeModal();
        }
    });
    bookingForm.addEventListener('submit', handleFormSubmit);

    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const searchDateString = searchDateInput.value;
        if (!searchDateString) return;

        // To avoid timezone issues, create date from parts
        const parts = searchDateString.split('-');
        const searchDate = new Date(parts[0], parts[1] - 1, parts[2]);

        currentDate = new Date(searchDate); // Set calendar to the searched date's month
        renderCalendar();

        // FIX: Timezone bug
        const filtered = bookings.filter(b => {
            const bookingDate = new Date(b.date);
            return bookingDate.getUTCFullYear() === searchDate.getFullYear() &&
                   bookingDate.getUTCMonth() === searchDate.getMonth() &&
                   bookingDate.getUTCDate() === searchDate.getDate();
        });
        renderBookingList(filtered);
    });

    resetSearchBtn.addEventListener('click', () => {
        searchForm.reset();
        currentDate = new Date(); // Reset calendar to current month
        renderCalendar();
        renderBookingList();
    });

    // --- Initial Load ---
    flatpickr("#search-date", {
        locale: "th",
        dateFormat: "Y-m-d",
    });

    fetchBookings();
});
