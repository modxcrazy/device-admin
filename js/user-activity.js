document.addEventListener('DOMContentLoaded', function() {
    // Initialize date range picker
    flatpickr("#dateRange", {
        mode: "range",
        dateFormat: "Y-m-d",
        defaultDate: [new Date(), new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)]
    });

    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            // Remove active class from all buttons and content
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked button and corresponding content
            this.classList.add('active');
            const tabId = this.getAttribute('data-tab') + 'Tab';
            document.getElementById(tabId).classList.add('active');
            
            // Load data for the selected tab if not already loaded
            loadTabData(this.getAttribute('data-tab'));
        });
    });

    // Load initial data
    loadTabData('usage');

    // Date filter apply
    document.getElementById('applyDateFilter').addEventListener('click', function() {
        const dates = document.getElementById('dateRange')._flatpickr.selectedDates;
        if (dates.length === 2) {
            const startDate = dates[0];
            const endDate = dates[1];
            loadDataWithDateRange(startDate, endDate);
        } else {
            alert('Please select a valid date range');
        }
    });

    // Restriction filter change
    document.getElementById('restrictionFilter').addEventListener('change', function() {
        updateRestrictionsTable(this.value);
    });

    // Functions to load data
    function loadTabData(tabName) {
        switch(tabName) {
            case 'usage':
                loadUsageData();
                break;
            case 'permissions':
                loadPermissionDenials();
                break;
            case 'restrictions':
                loadAccessRestrictions();
                break;
        }
    }

    function loadDataWithDateRange(startDate, endDate) {
        // This would filter all data views based on date range
        const activeTab = document.querySelector('.tab-btn.active').getAttribute('data-tab');
        loadTabData(activeTab);
    }

    function loadUsageData() {
        const usageRef = database.ref('userActivity/appUsage');
        
        usageRef.once('value').then(snapshot => {
            const usageData = snapshot.val();
            let totalMinutes = 0;
            const appUsage = [];
            
            if (usageData) {
                Object.keys(usageData).forEach(appId => {
                    const app = usageData[appId];
                    const minutes = Math.floor(app.totalUsage / 60000);
                    totalMinutes += minutes;
                    
                    appUsage.push({
                        appId,
                        name: app.appName || appId,
                        usage: minutes,
                        lastUsed: app.lastUsed,
                        trend: app.trend || 'neutral'
                    });
                });
                
                // Sort by usage time (descending)
                appUsage.sort((a, b) => b.usage - a.usage);
                
                // Update total usage display
                const hours = Math.floor(totalMinutes / 60);
                const mins = totalMinutes % 60;
                document.getElementById('totalUsage').textContent = `${hours}h ${mins}m`;
                
                // Update table
                const tableBody = document.getElementById('usageTableBody');
                tableBody.innerHTML = '';
                
                appUsage.forEach(app => {
                    const row = document.createElement('tr');
                    
                    row.innerHTML = `
                        <td>${app.name}</td>
                        <td>${formatUsageTime(app.usage)}</td>
                        <td>${app.lastUsed ? new Date(app.lastUsed).toLocaleString() : 'Never'}</td>
                        <td class="usage-trend">
                            <i class="fas ${getTrendIcon(app.trend)}"></i>
                            ${getTrendText(app.trend)}
                        </td>
                    `;
                    
                    tableBody.appendChild(row);
                });
                
                // Render chart
                renderUsageChart(appUsage.slice(0, 10)); // Show top 10 apps
            }
        });
    }

    function loadPermissionDenials() {
        const denialsRef = database.ref('userActivity/permissionDenials');
        
        denialsRef.once('value').then(snapshot => {
            const denialsData = snapshot.val();
            let totalDenials = 0;
            const permissions = [];
            
            if (denialsData) {
                Object.keys(denialsData).forEach(permission => {
                    const data = denialsData[permission];
                    totalDenials += data.count || 0;
                    
                    permissions.push({
                        permission,
                        count: data.count || 0,
                        lastDenied: data.lastDenied,
                        requestedBy: data.requestedBy ? data.requestedBy.join(', ') : 'N/A'
                    });
                });
                
                // Update total denials display
                document.getElementById('totalDenials').textContent = totalDenials;
                
                // Update table
                const tableBody = document.getElementById('denialsTableBody');
                tableBody.innerHTML = '';
                
                permissions.sort((a, b) => b.count - a.count).forEach(perm => {
                    const row = document.createElement('tr');
                    
                    row.innerHTML = `
                        <td>${formatPermissionName(perm.permission)}</td>
                        <td>${perm.count}</td>
                        <td>${perm.lastDenied ? new Date(perm.lastDenied).toLocaleString() : 'Never'}</td>
                        <td>${perm.requestedBy}</td>
                    `;
                    
                    tableBody.appendChild(row);
                });
                
                // Render chart
                renderDenialsChart(permissions);
            }
        });
    }

    function loadAccessRestrictions() {
        const restrictionsRef = database.ref('userActivity/accessRestrictions');
        
        restrictionsRef.once('value').then(snapshot => {
            const restrictionsData = snapshot.val();
            let restrictedApps = 0;
            const restrictions = [];
            
            if (restrictionsData) {
                Object.keys(restrictionsData).forEach(appId => {
                    const app = restrictionsData[appId];
                    restrictedApps++;
                    
                    Object.keys(app.permissions).forEach(permission => {
                        restrictions.push({
                            appId,
                            appName: app.appName || appId,
                            permission,
                            firstRestricted: app.permissions[permission].firstRestricted,
                            status: app.permissions[permission].status || 'restricted'
                        });
                    });
                });
                
                // Update restricted apps display
                document.getElementById('restrictedAccess').textContent = `${restrictedApps} apps`;
                
                // Update table
                updateRestrictionsTable('all', restrictions);
            }
        });
    }

    function updateRestrictionsTable(filter, restrictions) {
        const tableBody = document.getElementById('restrictionsTableBody');
        tableBody.innerHTML = '';
        
        const filtered = filter === 'all' 
            ? restrictions 
            : restrictions.filter(r => r.permission.includes(filter));
            
        filtered.forEach(restriction => {
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>${restriction.appName}</td>
                <td>${formatPermissionName(restriction.permission)}</td>
                <td>${restriction.firstRestricted ? new Date(restriction.firstRestricted).toLocaleString() : 'Unknown'}</td>
                <td><span class="status-badge status-${restriction.status}">${restriction.status}</span></td>
                <td>
                    <button class="btn btn-sm btn-primary" data-app="${restriction.appId}" data-permission="${restriction.permission}">
                        <i class="fas fa-undo"></i> Reset
                    </button>
                </td>
            `;
            
            tableBody.appendChild(row);
        });
        
        // Add event listeners to reset buttons
        document.querySelectorAll('#restrictionsTableBody button').forEach(btn => {
            btn.addEventListener('click', function() {
                const appId = this.getAttribute('data-app');
                const permission = this.getAttribute('data-permission');
                resetRestriction(appId, permission);
            });
        });
    }

    function resetRestriction(appId, permission) {
        if (confirm(`Are you sure you want to reset ${permission} restriction for ${appId}?`)) {
            database.ref(`userActivity/accessRestrictions/${appId}/permissions/${permission}`).update({
                status: 'allowed',
                lastUpdated: Date.now()
            }).then(() => {
                alert('Restriction reset successfully');
                loadAccessRestrictions();
            });
        }
    }

    // Chart rendering functions
    function renderUsageChart(appUsage) {
        const ctx = document.getElementById('usageChart').getContext('2d');
        
        if (window.usageChart) {
            window.usageChart.destroy();
        }
        
        window.usageChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: appUsage.map(app => app.name),
                datasets: [{
                    label: 'Usage Time (minutes)',
                    data: appUsage.map(app => app.usage),
                    backgroundColor: 'rgba(67, 97, 238, 0.7)',
                    borderColor: 'rgba(67, 97, 238, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Minutes'
                        }
                    }
                }
            }
        });
    }

    function renderDenialsChart(permissions) {
        const ctx = document.getElementById('denialsChart').getContext('2d');
        
        if (window.denialsChart) {
            window.denialsChart.destroy();
        }
        
        window.denialsChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: permissions.map(p => formatPermissionName(p.permission)),
                datasets: [{
                    data: permissions.map(p => p.count),
                    backgroundColor: [
                        'rgba(247, 37, 133, 0.7)',
                        'rgba(76, 201, 240, 0.7)',
                        'rgba(248, 150, 30, 0.7)',
                        'rgba(108, 117, 125, 0.7)',
                        'rgba(67, 97, 238, 0.7)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right'
                    }
                }
            }
        });
    }

    // Helper functions
    function formatUsageTime(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    }

    function getTrendIcon(trend) {
        return {
            'up': 'fa-arrow-up trend-up',
            'down': 'fa-arrow-down trend-down',
            'neutral': 'fa-minus trend-neutral'
        }[trend] || 'fa-minus trend-neutral';
    }

    function getTrendText(trend) {
        return {
            'up': 'Increasing',
            'down': 'Decreasing',
            'neutral': 'Stable'
        }[trend] || 'Stable';
    }

    function formatPermissionName(permission) {
        return permission.split('.').pop().replace(/_/g, ' ').toLowerCase()
            .replace(/\b\w/g, l => l.toUpperCase());
    }
});
