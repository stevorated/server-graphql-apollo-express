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
    <link
      rel="stylesheet"
      href="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css"
      integrity="sha384-ggOyR0iXCbMQv3Xipma34MD+dH/1fQ784/j6cY/iJTQUOhcWr7x9JvoRxT2MZw1T"
      crossorigin="anonymous"
    />
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

    <!-- Optional JavaScript -->
    <!-- jQuery first, then Popper.js, then Bootstrap JS -->
    <script
      src="https://code.jquery.com/jquery-3.3.1.slim.min.js"
      integrity="sha384-q8i/X+965DzO0rT7abK41JStQIAqVgRVzpbzo5smXKp4YfRvH+8abtTE1Pi6jizo"
      crossorigin="anonymous"
    ></script>
    <script
      src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.7/umd/popper.min.js"
      integrity="sha384-UO2eT0CpHqdSJQ6hJty5KVphtPhzWj9WO1clHTMGa3JDZwrnQq4sF86dIHNDz0W1"
      crossorigin="anonymous"
    ></script>
    <script
      src="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/js/bootstrap.min.js"
      integrity="sha384-JjSmVgyd0p3pXB1rRibZUAYoIIy6OrQ6VrjIEaFf/nJGzIxFDsf4x0xIM+B07jRM"
      crossorigin="anonymous"
    ></script>
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
