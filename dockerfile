# Step 1: Build the React frontend
FROM node:16 AS build

WORKDIR /app

# React 앱의 의존성 파일을 복사하고 의존성 설치
COPY client/package.json client/package-lock.json /app/
RUN npm install

# React 소스 코드 복사
COPY client/ /app/

# React 앱 빌드
RUN npm run build

# Step 2: Set up the Express backend
FROM node:16

WORKDIR /server

# 백엔드 의존성 파일을 복사하고 의존성 설치
COPY server/package.json server/package-lock.json /server/
RUN npm install

# Express 서버 파일 복사
COPY server/ /server/

# 빌드된 React 앱을 백엔드 폴더에 복사
COPY --from=build /app/build /server/public

# 서버 실행
CMD ["node", "server.js"]