# Project Instructions

1. Create a folder in your computer and clone the project
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

3. Commands
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


