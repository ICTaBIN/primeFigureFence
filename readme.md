# Project Instructions

1. Create a folder in your computer and open the terminal(or cmd) clone the project
   ```
   git clone https://github.com/ICTaBIN/cFigureFence.git
   ```
2. change directory to the cloned folder directory
   ```
   cd primeFigureFence
   ```

## Specific Instructions for Running Django Project
1. After Step 2( Navigating to cloned directory) run
```
ls
```
ls command will list all the files and directories(folders) in your current directory.

2. If you see `manage.py` there, run the following commands to run your project successfully

3. Create a Virtual Environment
    **For Windows
    ```
    python -m venv venv
    ```
    2. For Linux
    ```
    python3 -m venv venv
    ```
4. Activate the Virtual Environment
   1. For Windows
   ```
    venv/Scripts/activate
   ```
   2. For Linux
   ```
     source venv/bin/activate
   ```

5. Install Dependencies in the Environment
 ```
  pip install -r requirements.txt
 ```

6. Commands
```
python manage.py makemigrations
```

```
python manage.py migrate
```

optional
```
python manage.py createsuperuser
```
this command helps you register using   username and password that you can use to login to djangoAdmin  the `/admin`

```
python manage.py runserver
```


   
## git Related Guide - continues from step-2

3. Once inside your directory, Check if git folder exists by running status command
   ```
   git status
   ```
4. If everything is good, you should see something like
   `On branch master
   Your branch is up to date with 'origin/master'`
5. Now check which branch you are on by running
   ```
   git branch
   ```
   if it is your first time you will see a star with 'master'(the star represents the active branch)
6. Now if you have to start working you can either do
   ```
   git switch -c BRANCH_NAME
   ```
   replace BRANCH_NAME  with any meaningful name like `adding-google-auth-feature`, `fixing-app`, `converting-to-flask` so on

7. The above command will create new branch for you which is a copy of your master branch and switch you to that branch. You can
   verify it by running `git branch` notice the star symbol

8. Now you can start making changes to code and it won't change anything in the `master` or main branch
9. If you have an existing branch you can skip the step (6-8) and run
   ```
      git switch EXISTING_BRANCH_NAME
   ```
   this will switch you to existing code of that branch(notice the star symbol )
10. In case, your `master` branch is not up-to-date and you want to make changes to the EXISTING_BRANCH, you can make copy of that
using the same command in step 6(`git switch -c BRANCH_NAME`)

11. Once You have made some changes in your branch you can use
   ```
   git diff filename
   ```
   to see the changes you made in the file  OR
   ```
   git diff .
   ```
   to see all the changes in any file in the project

12. If the changes are OK. You need to Stage(add) them using  add command
  ```
   git add filename
  ```
   this will stage the specific file but if all the changes are fine, then use
   ```
   git add .
   ```

13. You can verify the staged changes using
 ```
  git status
 ```
14. If everything is OK. Commit the Changes along with a useful message
```
 git commit -m "initial version is functional"
```
15. Lastly, push the changes to your branch by doing
```
 git push origin BRANCH_NAME
```



