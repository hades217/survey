# Survey AI - Modern Survey Application

A modern, full-stack survey application built with Node.js, Express, MongoDB, React, TypeScript, and Tailwind CSS.

## Features

### 🎨 Modern UI/UX

- **Tailwind CSS**: Beautiful, responsive design with modern styling
- **Gradient backgrounds**: Eye-catching visual appeal
- **Card-based layout**: Clean and organized interface
- **Loading states**: Smooth user experience with loading indicators
- **Error handling**: User-friendly error messages

### 📱 Independent Survey URLs

- **Unique URLs**: Each survey has its own dedicated URL (e.g., `/survey/customer-feedback`)
- **QR Code Generation**: Generate QR codes for easy mobile access
- **Shareable Links**: Copy survey URLs to clipboard for easy sharing
- **Direct Access**: Users can access surveys directly via URL without selecting from a list

### 🔧 Admin Dashboard

- **Survey Management**: Create, edit, delete, and activate/deactivate surveys
- **Question Management**: Add multiple choice questions to surveys
- **Statistics**: View response statistics and analytics
- **QR Code Display**: Show QR codes for each survey
- **URL Management**: Copy survey URLs for sharing

### 📊 Survey Features

- **Multiple Choice Questions**: Support for radio button questions
- **User Information**: Collect name and email from respondents
- **Response Tracking**: Store and analyze survey responses
- **Active/Inactive Status**: Control survey availability

## Tech Stack

### Backend

- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **Session-based authentication** for admin access
- **RESTful API** design

### Frontend

- **React 18** with TypeScript
- **React Router** for navigation
- **Tailwind CSS** for styling
- **Axios** for API communication
- **QRCode** library for QR code generation
- **React Hook Form** for form handling

## 📚 Documentation

详细的系统文档请查看 [docs/](./docs/) 目录：

- **📖 [文档索引](./docs/README.md)** - 完整的文档导航和分类
- **🔐 [管理员功能](./docs/admin/)** - 管理员注册、个人资料等功能
- **⚡ [功能特性](./docs/features/)** - 调查类型、评估系统等功能
- **🔧 [实现细节](./docs/implementation/)** - 技术实现和架构说明
- **🧪 [测试相关](./docs/testing/)** - 测试用例和结果
- **🚀 [部署相关](./docs/deployment/)** - Docker部署和云服务配置
- **💻 [开发相关](./docs/development/)** - 开发规范和AI助手配置

## Getting Started

### Prerequisites

- Node.js (v20 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Installation

1. **Clone the repository**

    ```bash
    git clone <repository-url>
    cd survey_ai
    ```

2. **Install backend dependencies**

    ```bash
    npm install
    ```

3. **Install frontend dependencies**

    ```bash
    cd client
    npm install
    ```

4. **Set up environment variables**
   Create a `.env` file in the root directory:

    ```env
    MONGODB_URI=mongodb://localhost:27017/survey
    ADMIN_USERNAME=admin
    ADMIN_PASSWORD=password
    PORT=5050
    ```

5. **Start the backend server**

    ```bash
    npm start
    ```

6. **Start the frontend development server**

    ```bash
    cd client
    npm run dev
    ```

7. **Access the application**
    - Frontend: http://localhost:5173
    - Backend API: http://localhost:5050
    - Admin Dashboard: http://localhost:5173/admin

## Usage

### For Administrators

1. **Login to Admin Dashboard**
    - Navigate to `/admin`
    - Use default credentials: `admin` / `password`
    - Or set custom credentials in environment variables

2. **Create a Survey**
    - Fill in survey title and description
    - Click "Create Survey"
    - Add questions with multiple choice options

3. **Manage Surveys**
    - View all created surveys
    - Activate/deactivate surveys
    - Delete surveys (with confirmation)
    - Copy survey URLs
    - Generate QR codes for mobile access

4. **View Statistics**
    - Click "View Statistics" for any survey
    - See response counts for each question option

### For Survey Respondents

1. **Access Survey**
    - Use direct URL: `http://localhost:5173/survey/[survey-slug]`
    - Or scan QR code with mobile device
    - Or select from available surveys on homepage

2. **Complete Survey**
    - Enter name and email
    - Answer all questions (required)
    - Submit responses

3. **Confirmation**
    - Receive confirmation message
    - Option to take another survey

## API Endpoints

### Public Endpoints

- `GET /api/surveys` - List all active surveys
- `GET /api/survey/:slug` - Get survey by slug
- `POST /api/surveys/:id/responses` - Submit survey response

### Admin Endpoints (require authentication)

- `POST /api/admin/login` - Admin login
- `GET /api/admin/logout` - Admin logout
- `GET /api/admin/surveys` - List all surveys (admin)
- `POST /api/admin/surveys` - Create new survey
- `PUT /api/admin/surveys/:id` - Update survey
- `DELETE /api/admin/surveys/:id` - Delete survey
- `PUT /api/admin/surveys/:id/questions` - Add question to survey
- `GET /api/admin/surveys/:id/statistics` - Get survey statistics

## Project Structure

```
survey_ai/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── main.tsx        # App entry point
│   │   ├── Admin.tsx       # Admin dashboard
│   │   ├── TakeSurvey.tsx  # Survey taking interface
│   │   └── styles.css      # Tailwind CSS styles
│   ├── package.json
│   └── tailwind.config.js  # Tailwind configuration
├── models/                 # MongoDB models
│   ├── Survey.js          # Survey schema
│   └── Response.js        # Response schema
├── routes/                 # Express routes
│   ├── admin.js           # Admin routes
│   ├── surveys.js         # Survey routes
│   └── responses.js       # Response routes
├── server.js              # Express server
└── package.json
```

## Features in Detail

### Independent Survey URLs

Each survey gets a unique slug based on its title, creating URLs like:

- `http://localhost:5173/survey/customer-feedback`
- `http://localhost:5173/survey/employee-satisfaction`

This allows for:

- Direct sharing via email, messaging, or social media
- QR code generation for mobile access
- Easy integration into existing websites
- Better tracking and analytics

### QR Code Generation

- Automatically generates QR codes for each survey URL
- Click "Show QR" in admin dashboard to display
- Mobile users can scan to access survey directly
- Perfect for in-person events, posters, or printed materials

### Modern UI Components

- **Cards**: Clean, organized layout with shadows and borders
- **Buttons**: Consistent styling with hover effects
- **Forms**: Modern input fields with focus states
- **Loading States**: Spinners and disabled states during operations
- **Error Handling**: User-friendly error messages and validation

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License. 
test
