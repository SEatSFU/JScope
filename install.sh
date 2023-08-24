mx -y fetch-jdk --java-distribution labsjdk-ce-17 --to /app --alias labsjdk-ce-17
export JAVA_HOME=/app/labsjdk-ce-17
cd /app
# git clone https://github.com/Haiyang-Sun/nodeprof.js.git
git clone https://github.com/MohGanji/nodeprof.js.git
cd /app/nodeprof.js
git checkout 138a684
mx sforceimports
mx build
cd /app/jscope
npm run build