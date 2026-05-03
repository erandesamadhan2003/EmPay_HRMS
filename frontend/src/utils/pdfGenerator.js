import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generatePayslipPdf = (payslipData) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Helper formatting function
    const fmt = (val) => {
        const num = Number(val) || 0;
        return 'Rs ' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    // Header
    doc.setFontSize(22);
    doc.setTextColor(13, 148, 136); // Teal
    doc.text('EmPay HRMS', 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('PAYSLIP', pageWidth - 14, 22, { align: 'right' });

    // Pay Period
    const dateOpts = { month: 'long', year: 'numeric' };
    const periodStr = new Date(payslipData.periodStart).toLocaleDateString('en-IN', dateOpts);
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Payslip for the period of ${periodStr}`, 14, 32);

    doc.setLineWidth(0.5);
    doc.setDrawColor(200, 200, 200);
    doc.line(14, 36, pageWidth - 14, 36);

    // Employee Details
    doc.setFontSize(10);
    
    const detailsLeft = [
        ['Employee Name:', payslipData.employeeName || '—'],
        ['Employee Code:', payslipData.employeeCode || '—'],
        ['Designation:', payslipData.designation || '—'],
        ['Department:', payslipData.department || '—'],
        ['Date of Joining:', payslipData.dateOfJoining ? new Date(payslipData.dateOfJoining).toLocaleDateString('en-IN') : '—']
    ];

    const detailsRight = [
        ['Bank Account:', payslipData.bankAccount || '—'],
        ['PAN Number:', payslipData.panNumber || '—'],
        ['UAN Number:', payslipData.uanNumber || '—'],
        ['Total Working Days:', String(payslipData.workedDays?.totalWorkingDays || 0)],
        ['Payable Days:', String(payslipData.workedDays?.payableDays || 0)]
    ];

    let startY = 44;
    for (let i = 0; i < detailsLeft.length; i++) {
        // Left column
        doc.setFont('helvetica', 'bold');
        doc.text(detailsLeft[i][0], 14, startY);
        doc.setFont('helvetica', 'normal');
        doc.text(detailsLeft[i][1], 50, startY);

        // Right column
        doc.setFont('helvetica', 'bold');
        doc.text(detailsRight[i][0], pageWidth / 2 + 10, startY);
        doc.setFont('helvetica', 'normal');
        doc.text(detailsRight[i][1], pageWidth / 2 + 50, startY);

        startY += 7;
    }

    startY += 5;

    // Earnings and Deductions Table
    const e = payslipData.earnings || {};
    const d = payslipData.deductions || {};

    const earnings = [
        ['Basic Salary', fmt(e.basicSalary)],
        ['HRA', fmt(e.hra)],
        ['Standard Allowance', fmt(e.standardAllowance)],
        ['Performance Bonus', fmt(e.performanceBonus)],
        ['LTA', fmt(e.leaveTravelAllowance)],
        ['Fixed Allowance', fmt(e.fixedAllowance)],
    ].filter(item => Number(item[1].replace(/[^0-9.-]+/g, "")) > 0);

    const deductions = [
        ['PF (Employee)', fmt(d.pfEmployee)],
        ['Professional Tax', fmt(d.professionalTax)],
        ['TDS Deduction', fmt(d.tdsDeduction)],
    ].filter(item => Number(item[1].replace(/[^0-9.-]+/g, "")) > 0);

    // Make arrays equal length for the table
    const maxLen = Math.max(earnings.length, deductions.length);
    const tableBody = [];
    for (let i = 0; i < maxLen; i++) {
        tableBody.push([
            earnings[i] ? earnings[i][0] : '',
            earnings[i] ? earnings[i][1] : '',
            deductions[i] ? deductions[i][0] : '',
            deductions[i] ? deductions[i][1] : '',
        ]);
    }

    // Add totals row
    tableBody.push([
        'Total Earnings',
        fmt(e.grossSalary),
        'Total Deductions',
        fmt(d.totalDeductions)
    ]);

    autoTable(doc, {
        startY: startY,
        head: [['Earnings', 'Amount', 'Deductions', 'Amount']],
        body: tableBody,
        theme: 'grid',
        headStyles: { fillColor: [13, 148, 136] }, // Teal header
        styles: { fontSize: 9 },
        columnStyles: {
            1: { halign: 'right' },
            3: { halign: 'right' }
        },
        willDrawCell: function (data) {
            // Bold the last row (Totals)
            if (data.row.index === tableBody.length - 1) {
                doc.setFont('helvetica', 'bold');
            }
        }
    });

    // Net Salary
    const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 15 : startY + 50;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Net Salary Payable:', 14, finalY);
    
    doc.setFontSize(14);
    doc.setTextColor(13, 148, 136);
    doc.text(fmt(payslipData.netSalary), 55, finalY);

    // Footer note
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('This is a computer generated document and requires no signature.', pageWidth / 2, finalY + 20, { align: 'center' });

    doc.save(`payslip_${payslipData.employeeName?.replace(/\s+/g, '_') || 'employee'}.pdf`);
};
