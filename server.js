const express = require('express');
const path = require('path');
const xlsx = require('xlsx');
const rateLimit = require('express-rate-limit');

const app = express();

// إعدادات الحماية ضد هجمات الـ DDoS والـ Scraping
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 دقيقة
    max: 100, // أقصى عدد للطلبات من نفس الشخص
    message: { success: false, message: "تم تجاوز الحد المسموح به للبحث، يرجى المحاولة لاحقاً." }
});
app.use('/api/', limiter);

// تشغيل ملفات الـ HTML و الـ CSS
app.use(express.static(path.join(__dirname, 'public')));

// قراءة ملف الإكسيل (مهيئة لـ Vercel)
const filePath = path.join(process.cwd(), 'نتيجة ثانوية عامة نظام حديث (1).xlsx');
let studentsData = new Map();

try {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
    
    // تخزين البيانات في Map لسرعة البحث O(1)
    data.forEach(student => {
        // تأكد إن اسم العمود في الإكسيل مطابق للأسماء دي ('رقم الجلوس')
        const seatingKey = student['رقم الجلوس'] || student['Seating_No'] || student['رقم_الجلوس'];
        if(seatingKey) {
            studentsData.set(seatingKey.toString(), student);
        }
    });
    console.log("تم تحميل البيانات بنجاح");
} catch (error) {
    console.error("خطأ في قراءة ملف الإكسيل:", error);
}

// مسار البحث عن النتيجة
app.get('/api/result/:seatingNo', (req, res) => {
    const seatingNo = req.params.seatingNo;
    
    if (studentsData.has(seatingNo)) {
        const student = studentsData.get(seatingNo);
        res.json({
            success: true,
            data: {
                // تأكد من أسماء العواميد دي في ملف الإكسيل عندك
                name: student['الاسم'] || student['اسم الطالب'] || 'غير متوفر',
                degree: student['المجموع'] || student['المجموع الكلي'] || 'غير متوفر'
            }
        });
    } else {
        res.status(404).json({ success: false, message: 'رقم الجلوس غير صحيح أو غير موجود' });
    }
});

// هذا السطر هو الأهم لـ Vercel (بدلاً من app.listen)
module.exports = app;