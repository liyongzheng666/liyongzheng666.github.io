# Docker入门

# Docker初步入门
**这里不在介绍docker的理论知识，重点是对用到的一些内容进行总结，方便日后使用** 


## Docker安装 
这里我们是在云服务器进行的部署，所以基本的工作环境如下
  1. 准备工作
   ```bash
   #yum包进行更新
   # yum remove docker docker-common  docker-selinux docker-engine
   # rm -rf /var/lib/docker
   sudo yum update
   #安装软件包以及相关的依赖
   sudo yum install -y yum-utils device-mapper-persistent-data lvm2
   #给yum配置阿里云
   sudo yum-config-manager --add-repo http://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo
   ```
  2. 安装Docker软件 
   ```bash
   sudo yum install docker-ce
   docker -v
   ```
  3. 设置USTC的镜像
   ```bash
   vi /etc/docker/daemon.json  
   #进入文件之后可以继续输入以下内容
   {
   "registry-mirrors": ["https://docker.mirrors.ustc.edu.cn"]
   }
   ```

## Docker的启动与停止
1. 启动Docker：
   ```bash
   systemctl start docker
   ```
2. 停止Docker：
   ```bash
   systemctl stop docker
   ```  
3. 重新启动Docker：
   ```bash
   systemctl restart docker
   ```
4. 查看Docker状态：
   ```bash
   systemctl status docker
   ```  
5. 开机启动：
   ```bash
   systemctl enable docker
   ```  

## Docker镜像相关的命令






    

