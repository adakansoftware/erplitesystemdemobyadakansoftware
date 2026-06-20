"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.quotations = exports.quotationStatusMeta = void 0;
exports.lineTotal = lineTotal;
exports.quotationTotals = quotationTotals;
exports.getQuotationById = getQuotationById;
exports.quotationStatusMeta = {
    draft: { label: 'Taslak', variant: 'secondary' },
    sent: { label: 'Gonderildi', variant: 'info' },
    accepted: { label: 'Kabul Edildi', variant: 'success' },
    rejected: { label: 'Reddedildi', variant: 'destructive' },
    expired: { label: 'Suresi Doldu', variant: 'warning' },
};
function lineTotal(line) {
    const net = line.quantity * line.unitPrice;
    return net + net * (line.taxRate / 100);
}
function quotationTotals(lines) {
    const subtotal = lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);
    const tax = lines.reduce((s, l) => s + l.quantity * l.unitPrice * (l.taxRate / 100), 0);
    return { subtotal, tax, total: subtotal + tax };
}
exports.quotations = [
    {
        id: 'TKL-2024-0058',
        customer: 'Yildiz Insaat Ltd. Sti.',
        date: '2024-04-15',
        validUntil: '2024-04-30',
        status: 'sent',
        note: 'Santiye teslimat dahildir. Odeme 30 gun vadeli.',
        lines: [
            { product: 'Makita HR2470 Kirici Delici', quantity: 4, unitPrice: 4150, taxRate: 20 },
            { product: 'Bosch GSR 12V-15 Akulu Vidalama', quantity: 6, unitPrice: 3290, taxRate: 20 },
            { product: 'Is Guvenligi Baret Beyaz', quantity: 20, unitPrice: 135, taxRate: 20 },
        ],
    },
    {
        id: 'TKL-2024-0057',
        customer: 'Kaya Muhendislik A.S.',
        date: '2024-04-12',
        validUntil: '2024-04-27',
        status: 'accepted',
        note: 'Toplu alim indirimi uygulanmistir.',
        lines: [
            { product: 'DeWalt DCD709 Akulu Darbeli Matkap', quantity: 8, unitPrice: 5190, taxRate: 20 },
            { product: 'DeWalt Elmas Testere Disk 230mm', quantity: 25, unitPrice: 459, taxRate: 20 },
        ],
    },
    {
        id: 'TKL-2024-0056',
        customer: 'Demir Tadilat & Dekorasyon',
        date: '2024-04-10',
        validUntil: '2024-04-25',
        status: 'draft',
        note: '',
        lines: [
            { product: 'Marshall Maxi Plus Ic Cephe Boyasi 15L', quantity: 30, unitPrice: 920, taxRate: 20 },
            { product: 'Marshall Dis Cephe Boyasi 20L', quantity: 12, unitPrice: 1650, taxRate: 20 },
        ],
    },
    {
        id: 'TKL-2024-0055',
        customer: 'Anadolu Yapi Market',
        date: '2024-04-05',
        validUntil: '2024-04-20',
        status: 'rejected',
        note: 'Fiyat revizesi talep edildi.',
        lines: [
            { product: 'Karcher K5 Premium Yuksek Basincli Yikama', quantity: 10, unitPrice: 7290, taxRate: 20 },
        ],
    },
    {
        id: 'TKL-2024-0054',
        customer: 'Ercan Nalbur',
        date: '2024-03-28',
        validUntil: '2024-04-12',
        status: 'expired',
        note: '',
        lines: [
            { product: 'Ozkan Galvaniz Vida Seti 500 Parca', quantity: 100, unitPrice: 159, taxRate: 20 },
            { product: 'Bosch Profesyonel Tornavida Seti 40 Parca', quantity: 15, unitPrice: 649, taxRate: 20 },
        ],
    },
    {
        id: 'TKL-2024-0053',
        customer: 'Yildiz Insaat Ltd. Sti.',
        date: '2024-03-25',
        validUntil: '2024-04-09',
        status: 'accepted',
        note: 'Sozlesmeli musteri fiyati.',
        lines: [
            { product: 'Stanley FatMax Serit Metre 8m', quantity: 50, unitPrice: 289, taxRate: 20 },
            { product: 'Makita DUH523 Akulu Cit Bicme', quantity: 8, unitPrice: 3990, taxRate: 20 },
        ],
    },
];
function getQuotationById(id) {
    return exports.quotations.find((q) => q.id === id);
}
