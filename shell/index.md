# Shell学习总结

# Shell应知应会
1. 第一个Shell程序
    1. 解释器的交互环境
       优点：
          1. 及时看到代码结果
        缺点：
          1. 代码不能永久保存
    2. 把代码写入文件中，脚本程序
       优点：
          1. 程序永久保存，重复使用 
       bash运行步骤：
          1. 首先启动bash解释器
          2. 然后将程序由存储器读取到内存中
          3. 解释器件读取的程序，并且运行其中的内容，有问题就报错
2. 运行shell脚本的四种方式
   1. 绝对路径
      1. 权限问题：
         1. 对沿途的文件夹都应该有执行既x权限
         ```bash 
         chmod o+X 文件名
         ``` 
         1. 对保存脚本的这个文件夹需要有读和执行既r+x权限
      2. 用法：
         直接附上自己的绝对路径即可  
   2. 相对路径
      1. 权限问题：
         1. 同上
         2. 同上
      2. 用法；
         必须加上./作为前缀      
   3. 加上解释器作为前缀：bash 文件路径（绝对、相对都可）
      1. 对沿途的文件夹都应该有执行权限
      2. 对目标的bash文件具有读权限即可
      3. 用法：直接在路径前面加入bash
   4. 用source命令执行或者在路径前加.空格
      1.
   5. **介绍这四种启动方式的不同**
      1. 虽然四者都是开辟了子进程，但是前者与父进程没有内存关系，后者有
         最明显的就是，后者可以查看父进程的变量值 
3. ### 脚本调试功能
   1. 每一行代码执行前都会显示该执行语句
    ```bash
    bash -x 1.sh
    ```
   2. 可以显示注释 
    ```bash
    bash -vx 1.sh
    ```   
   3. 只调试部分代码，需要在脚本中进行添加内容
    ```bash
    #下面的代码是脚本中的内容
    #-x和+x之前的会逐步运行
    set -x
    echo 111
    echo 222
    set +x
    echo 333
    ```      


## Shell语法中变量与变量值的处理
1. ### 变量
   1. 介绍
      1. 变量名
      2. 赋值符号
      3. 变量值：数据
   2. 原则:先定义后引用
        ```bash
        #定义
        qian=30000
        #引用
        $qian#此时会显示30000，但是后面会有一些错误
        #删除
        unset qian#qian这个变量就会被释放
        #echo指令：打印的功效
        echo $qian #这样仅仅会打印
        #打印数值后面还要有字符
        echo ${qian}MY #这样后面就会有我们想要的东西了
        ``` 
   3. 变量名的命名规范：知道啥意思！不能与关键字重复！
      1. 小写字母加下划线->age_of_women=18
      2. 驼峰风格------->AgeOfWomen=18
   4. 变量值来源
      1. 直接赋值
      2. 可以通过脚本运行命令后面跟变量 
          $1 $2是在脚本运行后面的变量赋值到脚本程序中使用
      3. 与用户交互来获取相关的值
         ```shell 
         #下一行将要求您输入一个字符串，要求输入内容，赋给name 
         read -p "请输入您的账号：" name
         #可以给输入加一个限定的时间,超时时间便会跳过！
         read -p "请输入您的账号：" -t 5 name
         #可以限制字符数量
         read -p "请输入您的账号：" -n 2 name
         ```
         格式化输出：
         1. shell脚本语言
         ```shell 
         user="liyongzheng"
         mima_login="li618328"
         #注意下面一定使用的是双引号，否则打印出来的就是所谓的符号！
         echo "my name is $user my age is $mima_login"
         ``` 
         2. c语言
         ```c 
         user="liyongzheng"
         mima_login="li618328"
         //注意下面一定使用的是双引号，否则打印出来的就是所谓的符号！
         printf "my name is %s,my mima is %s\n" $user $mima_login
         ```                   
   5. 预定义变量
      1. $*  :获取所有的位置参数
      2. $@  ：获取所有的位置参数
      3. $#  : 获取所有的位置参数个数
      4. $$  :获取当前shell进程的pid
      5. $?  :获取上一条命令是否运行成功 
   6. 常量:不能被改变的值
      ```shell
      readonly y =1000
      ```  
2. ### 变量值的处理
   1. 基本数据类型
      1. 整形
      2. 浮点型
      3. 字符串
         1. 引用的字符具有特殊意义
            1. echo “=========>$x”
         2. 引用的字符没有特殊意义
            1. echo '=========>$x' 
            下面的这种方式虽然是双引号，但是我们可以在符号前面加一个转译符号即可无意义 
            2. echo “=========>\$x” 
      4. 数组：存取多个数值，并且可以顺利存取
         1. 普通数组: declare -a
            ```shell 
            hobby=("抽烟" "烫头" "打麻将")#=附近不能有空格  
            #下面这个语句则是查看目前已有的数组
            declare -a | grep hobby
            ```  
            ```shell 
            declare -a hobby 
            hobby[0]=1111
            hobby[1]=2222
            hobby[2]=3333
            echo ${hobby[0]}
            ```  
           
         2. 关联数组: declare -A
            :star::储存一个人的信息，年龄的时候，因为数据类型不一致，
            :star::但是这些数据都与一个人高度关联，所以出现关联数组！
            ```shell
            declare -A info=(["name"]="goudaner" ["age"]=18 ["gender"]="male")
            echo ${info["name"]}
            ```  
      5. :sparkling_heart:：shell是一门弱类型的语言意味着即使是字符串与数字也可以做运算
         ```shell 
         x=1;
         u="100"
         expr $x +$y
         #最终的结果可以显示101！！！
         ```   
   2. 变量值的相关操作
      1. 获取变量的长度
         ```shell
         x="hello"
         echo ${#x}
         #打印出来的结果就是x的长度：5
         #下面是其他的几种方式也可以
         expr length "$x"
         #下面的两种是自动忽视空格，即无论多少个空格都只算做一个空格
         echo $x | wc -L
         echo $x | awk '{print length}'
         ``` 
      2. 切片：取字符串的一部分
         ```shell
         msg="nihaoweilai"
         echo ${msg}
         echo ${msg:1}#打印结果：ihaoweilai
         echo ${msg:1:3}#打印结果：iha
         echo ${msg::3}#打印结果：nih
         ``` 
      3. 截断：与切片的功能的类似，但是对于处理长字符串更直接一些
         ```shell
         curl="www.baidu.com.cn"
         #截取部分进行赋值
         curl1=`echo ${curl#*.}`#curl1的值: baidu.com.cn
         curl1=`echo ${curl%.*}`#curl1的值: www.baidu.com
         echo ${curl}
         #下面介绍的是从左向右进行#截断
         echo ${curl#www.}#打印结果：baidu.com.cn
         echo ${curl#*.}#打印结果：baidu.com.cn
         echo ${msg##*.}#打印结果：cn
         #下面介绍的是从右向左进行%截断
         echo ${curl%.cn}#打印结果： www.baidu.com
         echo ${curl%.*} #打印结果： www.baidu.com
         echo ${curl%%.*}#打印结果： www
         ``` 
      4. 替换：进行字符串变量的部分内容替换
         1. 
```bash
echo '注意两端的括号都是单引号'
```

