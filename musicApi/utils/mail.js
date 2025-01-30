const config = require('../config');
const nodemailer = require("nodemailer");
const sendMail=async (emailCode,to)=>{
    const transporter = nodemailer.createTransport(config.mail.smtp);
	config.mail.content.html=config.mail.content.html.replace(/\[emailCode\]/g,emailCode)
    await transporter.sendMail({
		from: config.mail.smtp.auth.user,
		to,
		...config.mail.content
	});
}
module.exports=sendMail;