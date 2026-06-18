import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';

@Controller()
export class AppController {
  @Get()
  getHello(@Res() res: Response) {
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Banking Ledger API</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>
          body { font-family: 'Inter', sans-serif; }
        </style>
      </head>
      <body class="bg-gray-50 flex items-center justify-center min-h-screen text-gray-900">
        <div class="bg-white p-10 rounded-2xl shadow-xl max-w-lg w-full text-center">
          <h1 class="text-3xl font-bold mb-4 text-gray-800">Banking Ledger API</h1>
          <p class="text-gray-600 mb-6">The API is running successfully. This is the root endpoint.</p>
          <div class="grid gap-4 mt-6">
            <a href="/api/v1/health" class="flex items-center justify-center p-3 bg-blue-50 text-blue-700 font-medium rounded-lg hover:bg-blue-100 transition-colors">
              Health Check Status
            </a>
          </div>
        </div>
      </body>
      </html>
    `);
  }
}
