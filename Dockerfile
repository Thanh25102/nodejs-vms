# Sử dụng Node.js image làm nền tảng
FROM node:18

# Cài đặt Bun
RUN curl -fsSL https://bun.sh/install | bash

# Thiết lập biến môi trường cho Bun
ENV PATH="/root/.bun/bin:$PATH"

# Cài đặt ffmpeg
RUN apt-get update && \
    apt-get install -y ffmpeg && \
    rm -rf /var/lib/apt/lists/*

# Thiết lập thư mục làm việc trong container
WORKDIR /app

# Sao chép file package.json vào container
COPY package*.json ./

# Cài đặt dependencies bằng npm để tránh lỗi của Bun trong môi trường Docker
RUN npm install

# Sao chép toàn bộ mã nguồn vào container
COPY . .

# Expose cổng ứng dụng
EXPOSE 3002

# Khởi động ứng dụng bằng lệnh Bun
CMD ["bun", "index.ts"]
