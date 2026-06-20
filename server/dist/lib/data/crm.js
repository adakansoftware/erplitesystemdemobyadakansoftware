"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tasks = exports.taskPriorityMeta = exports.contacts = exports.companies = exports.deals = exports.dealStageMeta = exports.leads = exports.leadStatusMeta = void 0;
exports.leadStatusMeta = {
    new: { label: 'Yeni', variant: 'info' },
    contacted: { label: 'Iletisimde', variant: 'warning' },
    qualified: { label: 'Nitelikli', variant: 'success' },
    lost: { label: 'Kaybedildi', variant: 'destructive' },
};
exports.leads = [
    { id: 'LD-301', name: 'Hakan Aslan', company: 'Aslan Yapi', source: 'Web Sitesi', status: 'new', value: 42000, owner: 'Selin Kaya', createdAt: '2024-04-17' },
    { id: 'LD-302', name: 'Zeynep Toprak', company: 'Toprak Mimarlik', source: 'Referans', status: 'qualified', value: 128000, owner: 'Burak Demir', createdAt: '2024-04-15' },
    { id: 'LD-303', name: 'Murat Celik', company: 'Celik Insaat', source: 'Fuar', status: 'contacted', value: 76000, owner: 'Selin Kaya', createdAt: '2024-04-14' },
    { id: 'LD-304', name: 'Ayse Dogan', company: 'Dogan Dekor', source: 'Telefon', status: 'new', value: 23500, owner: 'Ahmet Yilmaz', createdAt: '2024-04-12' },
    { id: 'LD-305', name: 'Emre Sahin', company: 'Sahin Tadilat', source: 'Web Sitesi', status: 'lost', value: 18000, owner: 'Burak Demir', createdAt: '2024-04-10' },
    { id: 'LD-306', name: 'Gizem Yildiz', company: 'Yildiz Insaat', source: 'Referans', status: 'qualified', value: 215000, owner: 'Selin Kaya', createdAt: '2024-04-08' },
];
exports.dealStageMeta = {
    lead: { label: 'Aday', variant: 'secondary' },
    proposal: { label: 'Teklif', variant: 'info' },
    negotiation: { label: 'Gorusme', variant: 'warning' },
    won: { label: 'Kazanildi', variant: 'success' },
    lost: { label: 'Kaybedildi', variant: 'destructive' },
};
exports.deals = [
    { id: 'DL-501', title: 'Santiye ekipman paketi', customer: 'Yildiz Insaat Ltd. Sti.', stage: 'negotiation', value: 215000, owner: 'Selin Kaya', closeDate: '2024-05-05' },
    { id: 'DL-502', title: 'Toplu el aleti alimi', customer: 'Kaya Muhendislik A.S.', stage: 'proposal', value: 128000, owner: 'Burak Demir', closeDate: '2024-05-12' },
    { id: 'DL-503', title: 'Boya tedarik sozlesmesi', customer: 'Demir Tadilat & Dekorasyon', stage: 'won', value: 96000, owner: 'Ahmet Yilmaz', closeDate: '2024-04-18' },
    { id: 'DL-504', title: 'Bahce ekipmanlari', customer: 'Anadolu Yapi Market', stage: 'lead', value: 54000, owner: 'Selin Kaya', closeDate: '2024-05-20' },
    { id: 'DL-505', title: 'Is guvenligi malzemeleri', customer: 'Ercan Nalbur', stage: 'lost', value: 32000, owner: 'Burak Demir', closeDate: '2024-04-09' },
];
exports.companies = [
    { id: 'CO-101', name: 'Yildiz Insaat Ltd. Sti.', sector: 'Insaat', city: 'Istanbul', contacts: 4, openDeals: 2 },
    { id: 'CO-102', name: 'Kaya Muhendislik A.S.', sector: 'Muhendislik', city: 'Izmir', contacts: 3, openDeals: 1 },
    { id: 'CO-103', name: 'Demir Tadilat & Dekorasyon', sector: 'Tadilat', city: 'Istanbul', contacts: 2, openDeals: 1 },
    { id: 'CO-104', name: 'Anadolu Yapi Market', sector: 'Perakende', city: 'Ankara', contacts: 5, openDeals: 1 },
    { id: 'CO-105', name: 'Toprak Mimarlik', sector: 'Mimarlik', city: 'Bursa', contacts: 2, openDeals: 0 },
];
exports.contacts = [
    { id: 'CN-201', name: 'Mustafa Yildiz', title: 'Satin Alma Muduru', company: 'Yildiz Insaat Ltd. Sti.', email: 'mustafa@yildizinsaat.com', phone: '0212 555 12 34' },
    { id: 'CN-202', name: 'Pelin Kaya', title: 'Proje Sorumlusu', company: 'Kaya Muhendislik A.S.', email: 'pelin@kayamuh.com', phone: '0232 222 65 43' },
    { id: 'CN-203', name: 'Onur Demir', title: 'Sahibi', company: 'Demir Tadilat & Dekorasyon', email: 'onur@demirtadilat.com', phone: '0216 444 87 65' },
    { id: 'CN-204', name: 'Sibel Arslan', title: 'Magaza Muduru', company: 'Anadolu Yapi Market', email: 'sibel@anadoluyapi.com', phone: '0312 333 21 09' },
    { id: 'CN-205', name: 'Kemal Toprak', title: 'Mimar', company: 'Toprak Mimarlik', email: 'kemal@toprakmimarlik.com', phone: '0224 611 09 88' },
];
exports.taskPriorityMeta = {
    high: { label: 'Yuksek', variant: 'destructive' },
    medium: { label: 'Orta', variant: 'warning' },
    low: { label: 'Dusuk', variant: 'secondary' },
};
exports.tasks = [
    { id: 'TK-401', title: 'Yildiz Insaat teklif takibi', related: 'Yildiz Insaat Ltd. Sti.', due: '2024-04-22', priority: 'high', done: false, owner: 'Selin Kaya' },
    { id: 'TK-402', title: 'Kaya Muhendislik numune gonderimi', related: 'Kaya Muhendislik A.S.', due: '2024-04-23', priority: 'medium', done: false, owner: 'Burak Demir' },
    { id: 'TK-403', title: 'Demir Tadilat tahsilat hatirlatma', related: 'Demir Tadilat & Dekorasyon', due: '2024-04-20', priority: 'high', done: true, owner: 'Ahmet Yilmaz' },
    { id: 'TK-404', title: 'Anadolu Yapi fiyat revizesi', related: 'Anadolu Yapi Market', due: '2024-04-25', priority: 'low', done: false, owner: 'Selin Kaya' },
    { id: 'TK-405', title: 'Aylik satis raporu hazirligi', related: 'Ic Operasyon', due: '2024-04-30', priority: 'medium', done: false, owner: 'Mehmet Adakan' },
];
