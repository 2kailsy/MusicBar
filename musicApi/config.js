module.exports={
    jwtSecretKey: 'I love lsy forevery',
    expiresIn: '10h',
    mysql: {
        host: '127.0.0.1',
        port: '3306',
        user: 'music',
        password: 'music',
        database: 'music'
    },
	mail: {
		smtp: {
			host: "smtp.163.com",
			port: 465,
			secure: true,
			auth: {
			  user: 'sxssb123@163.com',
			  pass: 'XXXXXXXXXXXXXXXX',
			}
		},
		content: {
			subject: "Welcome to my music player",
			html: `欢迎注册2kの破音乐器, 您的邮箱验证码是:<b>[emailCode]</b>`,
		}
	}
}