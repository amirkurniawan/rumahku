// NIK Checker Module

// Function to check subsidi via API
async function checkSubsidi(nik) {
    try {
        // Use proxy server to bypass CORS
        const response = await fetch('http://localhost:3000/api/cek-subsidi', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ nik })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            if (errorData && errorData.error) {
                throw new Error(errorData.error);
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const htmlText = await response.text();
        parseSubsidiResponse(htmlText, nik);
    } catch (error) {
        console.error('Error:', error);

        // Check if proxy server is running
        if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
            showNotEligible('⚠️ Proxy server belum berjalan!\n\nSilakan jalankan:\n1. npm install\n2. npm run proxy\n\nLalu coba lagi.');
        } else {
            showNotEligible(`Terjadi kesalahan: ${error.message}`);
        }
    }
}

// Function to parse HTML response and extract table data
function parseSubsidiResponse(htmlText, nik) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, 'text/html');

    // Find table with id="example1"
    const table = doc.getElementById('example1');

    if (!table) {
        showNotEligible('Data tidak ditemukan untuk NIK tersebut.');
        return;
    }

    // Extract table data
    const rows = table.querySelectorAll('tbody tr');

    if (rows.length === 0) {
        showNotEligible('Tidak ada data subsidi untuk NIK tersebut.');
        return;
    }

    // Extract data from table
    const subsidyData = [];
    rows.forEach(row => {
        const cols = row.querySelectorAll('td');
        if (cols.length > 0) {
            const rowData = {};
            cols.forEach((col, index) => {
                rowData[`col${index}`] = col.textContent.trim();
            });
            subsidyData.push(rowData);
        }
    });

    // Check if ALL status is Eligible (kolom 4 / index 3)
    // col0=No, col1=NIK, col2=Nama, col3=Status (index 3)
    const allEligible = subsidyData.every(data => {
        const status = data.col3 || ''; // Kolom 4 (index 3) adalah Status
        return status.toLowerCase().trim() === 'eligible';
    });

    if (allEligible) {
        // Semua status Eligible -> Popup hijau
        showEligiblePopup(subsidyData, nik);
    } else {
        // Ada yang Not Eligible -> Popup merah dengan data table
        showNotEligibleWithData(subsidyData, nik);
    }
}

// Show Eligible Popup
function showEligiblePopup(data, nik) {
    // Close NIK modal first
    const nikModal = document.getElementById('nikModal');
    if (nikModal) nikModal.classList.remove('active');

    // Create result modal
    const resultModal = document.createElement('div');
    resultModal.id = 'subsidyResultModal';
    resultModal.className = 'modal active';

    // Define column headers
    const headers = ['No', 'NIK', 'Nama', 'Status', 'Keterangan', 'DTSEN', 'BSPS', 'FLPP', 'BP2BT'];

    let tableHTML = '<table style="width: 100%; border-collapse: collapse; margin-top: 1rem;">';
    tableHTML += '<thead><tr style="background: #2c7be5; color: white;">';

    // Create headers based on defined array
    const firstRow = data[0];
    const colCount = Object.keys(firstRow).length;

    for (let i = 0; i < colCount; i++) {
        const headerName = headers[i] || `Kolom ${i + 1}`;
        tableHTML += `<th style="padding: 0.75rem; border: 1px solid #ddd; text-align: left; font-weight: 600;">${headerName}</th>`;
    }
    tableHTML += '</tr></thead><tbody>';

    // Add data rows
    data.forEach((row, index) => {
        tableHTML += `<tr style="background: ${index % 2 === 0 ? '#f9fafb' : 'white'};">`;
        Object.values(row).forEach((value, colIndex) => {
            let style = 'padding: 0.75rem; border: 1px solid #ddd;';

            // Kolom 4 adalah Status (index 3)
            if (colIndex === 3) {
                if (value.toLowerCase().includes('eligible')) {
                    // Eligible = hijau
                    style += ' color: #00d97e; font-weight: bold; background: rgba(0, 217, 126, 0.1);';
                } else if (value.toLowerCase().includes('not eligible')) {
                    // Not Eligible = merah
                    style += ' color: #e63757; font-weight: bold; background: rgba(230, 55, 87, 0.1);';
                }
            }

            tableHTML += `<td style="${style}">${value}</td>`;
        });
        tableHTML += '</tr>';
    });
    tableHTML += '</tbody></table>';

    resultModal.innerHTML = `
        <div class="modal-content" style="max-width: 1000px; max-height: 80vh; overflow-y: auto;">
            <span class="modal-close" onclick="document.getElementById('subsidyResultModal').remove()">&times;</span>
            <div style="text-align: center; margin-bottom: 1.5rem;">
                <div style="width: 60px; height: 60px; background: #00d97e; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 1rem;">
                    <i class="fas fa-check" style="color: white; font-size: 2rem;"></i>
                </div>
                <h2 style="color: #00d97e; margin-bottom: 0.5rem;">Selamat! Anda Eligible</h2>
                <p style="color: #666;">NIK: ${nik}</p>
            </div>
            <div style="background: #f9fafb; padding: 1rem; border-radius: 0.5rem; margin-bottom: 1rem; overflow-x: auto;">
                <h3 style="margin-bottom: 0.5rem; font-size: 1.1rem;">Detail Data Subsidi:</h3>
                ${tableHTML}
            </div>
            <div style="text-align: center; margin-top: 1.5rem;">
                <button onclick="document.getElementById('subsidyResultModal').remove()" class="btn btn-primary">
                    Tutup
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(resultModal);

    // Close on outside click
    resultModal.addEventListener('click', function(e) {
        if (e.target === resultModal) {
            resultModal.remove();
        }
    });
}

// Show Not Eligible notification (simple message)
function showNotEligible(message) {
    const nikModal = document.getElementById('nikModal');
    if (nikModal) nikModal.classList.remove('active');

    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        padding: 2rem;
        border-radius: 0.5rem;
        box-shadow: 0 10px 40px rgba(0,0,0,0.2);
        z-index: 10001;
        text-align: center;
        max-width: 400px;
    `;

    notification.innerHTML = `
        <div style="width: 60px; height: 60px; background: #e63757; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 1rem;">
            <i class="fas fa-times" style="color: white; font-size: 2rem;"></i>
        </div>
        <h3 style="margin-bottom: 1rem; color: #e63757;">Tidak Eligible</h3>
        <p style="color: #666; margin-bottom: 1.5rem; white-space: pre-line;">${message}</p>
        <button onclick="this.parentElement.remove()" class="btn btn-primary">Tutup</button>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        if (notification.parentElement) notification.remove();
    }, 10000);
}

// Show Not Eligible with Data Table
function showNotEligibleWithData(data, nik) {
    // Close NIK modal first
    const nikModal = document.getElementById('nikModal');
    if (nikModal) nikModal.classList.remove('active');

    // Create result modal
    const resultModal = document.createElement('div');
    resultModal.id = 'subsidyResultModal';
    resultModal.className = 'modal active';

    // Define column headers
    const headers = ['No', 'NIK', 'Nama', 'Status', 'Keterangan', 'DTSEN', 'BSPS', 'FLPP', 'BP2BT'];

    let tableHTML = '<table style="width: 100%; border-collapse: collapse; margin-top: 1rem;">';
    tableHTML += '<thead><tr style="background: #2c7be5; color: white;">';

    // Create headers based on defined array
    const firstRow = data[0];
    const colCount = Object.keys(firstRow).length;

    for (let i = 0; i < colCount; i++) {
        const headerName = headers[i] || `Kolom ${i + 1}`;
        tableHTML += `<th style="padding: 0.75rem; border: 1px solid #ddd; text-align: left; font-weight: 600;">${headerName}</th>`;
    }
    tableHTML += '</tr></thead><tbody>';

    // Add data rows
    data.forEach((row, index) => {
        tableHTML += `<tr style="background: ${index % 2 === 0 ? '#f9fafb' : 'white'};">`;
        Object.values(row).forEach((value, colIndex) => {
            let style = 'padding: 0.75rem; border: 1px solid #ddd;';

            // Kolom 4 adalah Status (index 3)
            if (colIndex === 3) {
                if (value.toLowerCase().trim() === 'eligible') {
                    // Eligible = hijau
                    style += ' color: #00d97e; font-weight: bold; background: rgba(0, 217, 126, 0.1);';
                } else if (value.toLowerCase().includes('not eligible')) {
                    // Not Eligible = merah
                    style += ' color: #e63757; font-weight: bold; background: rgba(230, 55, 87, 0.1);';
                }
            }

            tableHTML += `<td style="${style}">${value}</td>`;
        });
        tableHTML += '</tr>';
    });
    tableHTML += '</tbody></table>';

    resultModal.innerHTML = `
        <div class="modal-content" style="max-width: 1000px; max-height: 80vh; overflow-y: auto;">
            <span class="modal-close" onclick="document.getElementById('subsidyResultModal').remove()">&times;</span>
            <div style="text-align: center; margin-bottom: 1.5rem;">
                <div style="width: 60px; height: 60px; background: #e63757; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 1rem;">
                    <i class="fas fa-times" style="color: white; font-size: 2rem;"></i>
                </div>
                <h2 style="color: #e63757; margin-bottom: 0.5rem;">Maaf, Anda Belum Layak</h2>
                <p style="color: #666;">NIK: ${nik}</p>
            </div>
            <div style="background: #f9fafb; padding: 1rem; border-radius: 0.5rem; margin-bottom: 1rem; overflow-x: auto;">
                <h3 style="margin-bottom: 0.5rem; font-size: 1.1rem;">Detail Data Subsidi:</h3>
                ${tableHTML}
            </div>
            <div style="text-align: center; margin-top: 1.5rem;">
                <button onclick="document.getElementById('subsidyResultModal').remove()" class="btn btn-primary">
                    Tutup
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(resultModal);

    // Close on outside click
    resultModal.addEventListener('click', function(e) {
        if (e.target === resultModal) {
            resultModal.remove();
        }
    });
}

function initNikChecker() {
    console.log('Initializing NIK Checker...');

    const modal = document.getElementById('nikModal');
    const btn = document.getElementById('cekNikBtn');

    if (!modal) {
        console.warn('Modal NIK belum loaded, retry in 200ms...');
        setTimeout(initNikChecker, 200);
        return;
    }

    if (!btn) {
        console.warn('Button CEK NIK belum loaded, retry in 200ms...');
        setTimeout(initNikChecker, 200);
        return;
    }

    console.log('✅ NIK Checker ready!');

    const closeBtn = modal.querySelector('.modal-close');
    const nikForm = document.getElementById('nikForm');
    const nikInput = document.getElementById('nikInput');
    const nikError = document.getElementById('nikError');

    // Open modal
    btn.addEventListener('click', function(e) {
        e.preventDefault();
        console.log('Opening modal...');
        modal.classList.add('active');
    });

    // Close modal
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            modal.classList.remove('active');
            resetForm();
        });
    }

    // Close when clicking outside
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.classList.remove('active');
            resetForm();
        }
    });

    // Input validation
    if (nikInput) {
        nikInput.addEventListener('input', function() {
            this.value = this.value.replace(/[^0-9]/g, '');
            
            if (this.value.length > 0) {
                nikInput.classList.remove('error');
                nikError.classList.remove('show');
            }
        });
    }

    // Form submit
    if (nikForm) {
        nikForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const nikValue = nikInput.value.trim();

            if (nikValue.length !== 16) {
                showError('NIK harus 16 digit angka');
                return;
            }

            if (!/^\d{16}$/.test(nikValue)) {
                showError('NIK hanya boleh berisi angka');
                return;
            }

            // Show loading state
            const submitBtn = nikForm.querySelector('.btn-submit');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Memproses...';
            submitBtn.disabled = true;

            try {
                await checkSubsidi(nikValue);
            } catch (error) {
                console.error('Error checking subsidi:', error);
                showError('Terjadi kesalahan. Silakan coba lagi.');
            } finally {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });
    }

    function showError(message) {
        nikInput.classList.add('error');
        nikError.textContent = message;
        nikError.classList.add('show');
    }

    function resetForm() {
        if (nikForm) nikForm.reset();
        nikInput.classList.remove('error');
        nikError.classList.remove('show');
    }
}

// Auto-initialize when script loads
if (typeof initNikChecker === 'function') {
    console.log('NIK Checker script loaded');
}