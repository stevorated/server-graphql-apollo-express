import sgMail from '@sendgrid/mail'
sgMail.setApiKey(process.env.SG_API_KEY)

export const sendWelcomeEmail = (email, name, link) => {
  console.log(email, link, name)
  return sgMail.send({
    to: email,
    from: 'do-not-reply@di.bil.com',
    subject: 'Thanks for Joining wisdom of de crowd',
    html: html(name, link)
  })
}

export const sendResetPasswordEmail = (email, link) => {
  console.log(email, link)
  // console.log(html2(link))
  return sgMail.send({
    to: email,
    from: 'do-not-reply@di.bil.com',
    subject: 'Reset Password: wisdomofdecrowd.com',
    html: html2(link)
  })
}

// export const sendGoodbyeEmail = (email, name) => {
//   return sgMail.send({
//     to: email,
//     from: 'yaalla@dib.il.com.here',
//     subject: 'Sorry to see you go.',
//     text: `${name} why u leaving? Ti ni Alla!`
//   })
// }

const html = (fname, link) => `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="X-UA-Compatible" content="ie=edge" />
    <title>Welcome to Wisdom Of De Crowd!</title>
  </head>
  <body class="bg-light">
    <div class="container-fluid text-capitalize">
      <div class="row">
        <div class="col-md-12">
          <h3 class="text-center mt-3 header-4">Welcome to Wisdom Of De Crowd ${fname}, Thanks for Joining!</h3>

        </div>
        <div class="col-md-12 mt-4 ">
          <p class="text-center lead">that was very wise of you.</p>
          <p class="text-center mt-5">Just One More little thing</p>
          <p class="text-center">please confirm your email by clicking this <a href="${link}">Link</a></p>
        </div>
      </div>
    </div>
  </body>
</html>
`

const html2 = (link) => `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="X-UA-Compatible" content="ie=edge" />
    <title>Reset password to Wisdom Of De Crowd</title>
  </head>
  <body class="bg-light">
    <div class="container-fluid text-capitalize">
      <div class="row">
        <div class="col-md-12">
          <h3 class="text-center mt-3 header-4">Reset password to Wisdom Of De Crowd</h3>
        </div>
        <div class="col-md-12 mt-4 ">
          <p class="text-center lead">click on the link bellow</p>
          <p class="text-center mt-5">there you woll be prompted to choose a new password</p>
          <p class="text-center"><a href="${link}">Link</a></p>
        </div>
      </div>
    </div>
  </body>
</html>
`
