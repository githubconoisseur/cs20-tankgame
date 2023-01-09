let cnv = document.getElementById("canvas");
let ctx = cnv.getContext("2d");
let wallAmount = document.getElementById("walls1")
let wall2Amount = document.getElementById("walls2")
let startButton = document.getElementById("start")

cnv.width = 1200;
cnv.height = 800;

let keyPressed = {}

document.addEventListener("keydown", (e) => {
  let keyPress = e.key;
  keyPressed[keyPress] = true
});
document.addEventListener("keyup", (e) => {
  let keyPress = e.key;
  keyPressed[keyPress] = false
});


class tank {

    // init the tank 
    constructor(color, xpos, ypos) {
      this.color = color
      this.x = xpos;
      this.y = ypos;
      this.width = 30;
      this.height = 30;
      this.speed = 2;
      this.rotate = 0;
      this.rotateSpeed = 5;
      this.turret = {
        x: this.x,
        y: this.y,
        rotate: 0,
        r: 8,
        width: 7,
        l: 15,
        fireTimeout: 0,
      };
      this.destroyed = false;
      this.angle = Math.atan(this.height / this.width);
      this.diagonal = Math.sqrt(this.width ** 2 + this.height ** 2) / 2;
      this.bulletSpeed = 5;
      this.magazine = [];
      this.staggerBullet = false;
      this.hit = false
    }

    updateBullets(board) {
        for (let i = 0; i < this.magazine.length; i++) {
          this.magazine[i].update(board)
      }
    }
  
    updateTankPos() {
      let rotateMinusAngle = this.rotate - this.angle;
      let rotatePlusAngle = this.rotate + this.angle;
  
      return {
        x: this.x,
        y: this.y,
        points: [
          {
            x: Math.cos(rotateMinusAngle) * this.diagonal,
            y: Math.sin(rotateMinusAngle) * this.diagonal,
          },
          {
            x: Math.cos(rotatePlusAngle) * this.diagonal,
            y: Math.sin(rotatePlusAngle) * this.diagonal,
          },
          {
            x: Math.cos(rotateMinusAngle + Math.PI) * this.diagonal,
            y: Math.sin(rotateMinusAngle + Math.PI) * this.diagonal,
          },
          {
            x: Math.cos(rotatePlusAngle + Math.PI) * this.diagonal,
            y: Math.sin(rotatePlusAngle + Math.PI) * this.diagonal,
          },
        ],
      };
    }
  
  
    drawTurret(tur) {
      let alpha = Math.asin(tur.width / 2 / tur.r),
        beta = Math.atan(tur.width / 2 / (tur.r + tur.l)),
        startAngle = tur.rotate + alpha,
        endAngle = tur.rotate + 2 * Math.PI - alpha;
      ctx.beginPath();
      ctx.arc(tur.x, tur.y, tur.r, startAngle, endAngle, false);
      ctx.lineTo(
        tur.x + (tur.r + tur.l) * Math.cos(tur.rotate - beta),
        tur.y + (tur.r + tur.l) * Math.sin(tur.rotate - beta)
      );
      ctx.lineTo(
        tur.x + (tur.r + tur.l) * Math.cos(tur.rotate + beta),
        tur.y + (tur.r + tur.l) * Math.sin(tur.rotate + beta)
      );
      ctx.closePath();
  
      ctx.strokeStyle = "#000";
      ctx.fillStyle = tur.color || this.turret.color;
      ctx.stroke();
      ctx.fill();
    }
  
    // draws the tank
    drawTank() {
      let poly = this.updateTankPos();
      ctx.beginPath();
      for (let i = 0; i < poly.points.length; i++) {
        if (i === 0) {
          ctx.moveTo(poly.x + poly.points[i].x, poly.y + poly.points[i].y);
        } else {
          ctx.lineTo(poly.x + poly.points[i].x, poly.y + poly.points[i].y);
        }
      }
      ctx.closePath();
      ctx.strokeStyle = "#000";
      ctx.fillStyle = this.color;
      ctx.stroke();
      ctx.fill();
      this.drawTurret(this.turret);
    }
    
    tankWallCol() {
      for (const item of Board.redWalls) {
        let wall = JSON.parse(item)
        if (this.x + this.diagonal > wall.x * Board.wallW && this.x - this.diagonal < wall.x * Board.wallW + Board.wallW && this.y + this.diagonal > wall.y * Board.wallH && this.y - this.diagonal < wall.y * Board.wallH + Board.wallH || this.x + this.diagonal > cnv.width || this.x - this.diagonal < 0 || this.y + this.diagonal > cnv.height || this.y - this.diagonal < 0 ) {
          return true
        }
      }
      for (const item of Board.blueWalls) {
        let wall = JSON.parse(item)
        if (this.x + this.diagonal > wall.x * Board.wallW && this.x - this.diagonal < wall.x * Board.wallW + Board.wallW && this.y + this.diagonal > wall.y * Board.wallH && this.y - this.diagonal < wall.y * Board.wallH + Board.wallH || this.x + this.diagonal > cnv.width || this.x - this.diagonal < 0 || this.y + this.diagonal > cnv.height || this.y - this.diagonal < 0 ) {
          return true
        }
      }
    }


    tankBulletCol(otherTank) {
      let bullets = this.magazine.concat(otherTank.magazine) 
      for (let i = 0; i < bullets.length; i++) {
        if (bullets[i].x + bullets[i].radius > this.x - this.width/2 && bullets[i].x -bullets[i].radius < this.x + this.width/2 && bullets[i].y + bullets[i].radius > this.y - this.width/2 && bullets[i].y - bullets[i].radius < this.y + this.width/2) {
          this.hit = true
        }
      }
    } 


    fireBullet() {
        if (!this.staggerBullet && this.magazine.length < 6) {

            let x,y,dx,dy;

            x=
                this.turret.x +
                Math.cos(this.turret.rotate) * (this.turret.r + this.turret.l + 5) 
            y=
                this.turret.y +
                Math.sin(this.turret.rotate) * (this.turret.r + this.turret.l + 5) 
            dx= this.bulletSpeed * Math.cos(this.turret.rotate)
            dy= this.bulletSpeed * Math.sin(this.turret.rotate)

            let newBullet = new bullet(x,y,dx,dy);
            newBullet.startDespawnTimer(this.magazine);

            
            this.staggerBullet = true;
            this.staggerTimer();
            this.magazine.push(newBullet);
          }
    }

    staggerTimer() {
        if (this.staggerBullet) {
            setTimeout(() => {
                this.staggerBullet = false;
            }, 100);
        }
    }


    keyDowns(upkey, downkey,rightkey,leftkey,shootkey) {
      if (keyPressed[leftkey]) {
        this.rotate += (-1 * this.rotateSpeed * Math.PI) / 180;
        this.turret.rotate = this.rotate;
      } else if (keyPressed[rightkey]) {
        this.rotate += (this.rotateSpeed * Math.PI) / 180;
        this.turret.rotate = this.rotate;
      }
    
      if (keyPressed[upkey]) {
        this.x += this.speed * Math.cos(this.rotate);
        if (this.tankWallCol()) {
          this.x -= this.speed * Math.cos(this.rotate);
        }
        this.y += this.speed * Math.sin(this.rotate);
        if (this.tankWallCol()) {
          this.y -= this.speed * Math.sin(this.rotate);
        }
        this.turret.x = this.x;
        this.turret.y = this.y;
        
      } else if (keyPressed[downkey]) {
        this.x -= this.speed * Math.cos(this.rotate);
        if (this.tankWallCol()) {
          this.x += this.speed * Math.cos(this.rotate);
        }
        this.y -= this.speed * Math.sin(this.rotate);
        if (this.tankWallCol()) {
          this.y += this.speed * Math.sin(this.rotate);
        }
        this.turret.x = this.x;
        this.turret.y = this.y;
      }
      if (keyPressed[shootkey]) {
        this.fireBullet();
      }
    }
  }


  class bullet {
    constructor(x, y, xspeed, yspeed) {
        this.x = x;
        this.y = y;
        this.dx = xspeed;
        this.dy = yspeed;
        this.radius = 5;
        this.staggerBullet = false;
    }

    wallCol() {
        if (
          this.x + this.radius > cnv.width ||
          this.x - this.radius < 0
        ) {
          this.dx =
            this.dx * -1 
        } else if (
          this.y + this.radius > cnv.height ||
          this.y - this.radius < 0
        ) {
          this.dy = this.dy * -1;
        }
    }

    collide(board) {
        for (const item of board.redWalls) {
            let wall = JSON.parse(item)
            if (
              this.x - this.radius <
                wall.x * board.wallW + board.wallW &&
              this.x + this.radius > wall.x * board.wallW &&
              this.y - this.radius <
                wall.y * board.wallH + board.wallH &&
              this.y + this.radius > wall.y * board.wallH
            ) {
             board.redWalls.delete(item)
              return true
            }
          }
          for (const item of board.blueWalls) {
            let wall = JSON.parse(item)
            if (
              this.x - this.radius <
                wall.x * board.wallW + board.wallW &&
              this.x + this.radius > wall.x * board.wallW &&
              this.y - this.radius <
                wall.y * board.wallH + board.wallH &&
              this.y + this.radius > wall.y * board.wallH
            ) {
             board.blueWalls.delete(item)
              return true
            }
          }
          return false;
    }

    update(board){
        this.updateBulletPosX(board);
        this.updateBulletPosY(board);
        this.wallCol();
        this.draw()
    }

    draw(){
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
        ctx.fillStyle = "#000000";
        ctx.fill();
    }

    updateBulletPosX(board) {
        this.x += this.dx
        if (this.collide(board)) {
          this.x -= this.dx
          this.dx = -1 * (this.dx)
        }
      }
      updateBulletPosY(board) {
        this.y += this.dy
        if (this.collide(board)) {
          this.y -= this.dy
          this.dy = -1 * (this.dy)
        }
      }

    startDespawnTimer(magazine) {
        setTimeout(() => {
            magazine.shift();
        }, 4000);
    }
}


class board {
    constructor(boardCells) {
      this.boardCells = boardCells;
      this.drawable = false;
      this.xCoord;
      this.yCoord;
      this.wallW = cnv.width / boardCells;
      this.wallH = cnv.height / boardCells;
      this.blueWalls = new Set();
      this.redWalls = new Set();
      this.start = false
    }
    
    outsideClickCheck(xpos,ypos) {
        if (xpos < 0 || xpos > cnv.width || ypos < 0 || ypos > cnv.height) {
            this.outsideClick = true;
            console.log("cmon man");
          } else {
            this.outsideClick = false;
          }
    }

    getCanvasCoord(xpos,ypos) {
        this.xCoord = Math.floor(xpos / (cnv.width / this.boardCells));
        this.yCoord = Math.floor(ypos / (cnv.height / this.boardCells));
    }

    addNewWall() {
        let newWall = {
            x: this.xCoord,
            y: this.yCoord,
          }
          if (!this.outsideClick) {
            if (newWall.x * this.wallW < cnv.width/2 && this.blueWalls.size < 100) {
              this.blueWalls.add(JSON.stringify(newWall));
                } else if (newWall.x * this.wallW >= cnv.width/2 && this.redWalls.size < 100) {
                  this.redWalls.add(JSON.stringify(newWall));
                }
              }
    }

    onPress(event) {
      if (this.start === true) return
      if (this.drawable === false) return;
      let xpos, ypos;
      let x = cnv.offsetLeft;
      let y = cnv.offsetTop;
      xpos = event.clientX - x + cnv.width / 2;
      ypos = event.clientY - y + cnv.height / 2;
  
      this.outsideClickCheck(xpos, ypos)

      this.getCanvasCoord(xpos,ypos)

      this.addNewWall()
    }

    initWall(wallSet, color, wallCounter) {
        if (wallSet.size > 0) {
            for (const item of wallSet) {
              let wall = JSON.parse(item)
              ctx.fillStyle = color
              ctx.fillRect(
                wall.x * this.wallW,
                wall.y * this.wallH,
                this.wallW,
                this.wallH
              );
            }
          }
          wallCounter.innerHTML = wallSet.size
    }

    drawWalls() {
        this.initWall(this.blueWalls, "#0062b6", wallAmount)
        this.initWall(this.redWalls, "#d81111", wall2Amount)
    }

    eraseWall(event) {
      let xpos, ypos;
      let x = cnv.offsetLeft;
      let y = cnv.offsetTop;
      xpos = event.clientX - x + cnv.width / 2;
      ypos = event.clientY - y + cnv.height / 2;
  
      this.getCanvasCoord(xpos,ypos)

      for (const item of this.blueWalls) {
        let wall = JSON.parse(item)
        if (this.xCoord === wall.x && this.yCoord === wall.y) {
         this.blueWalls.delete(item)
         return true
        }
      }
      for (const item of this.redWalls) {
        let wall = JSON.parse(item)
        if (this.xCoord === wall.x && this.yCoord === wall.y) {
         this.redWalls.delete(item)
         return true
        }
      } 
    }
}

let shanka = new tank("#d81111", 1170, 770);
let tanka = new tank("#0062b6", 30, 30);


let Board = new board(40);

document.addEventListener("mousedown", function (e) {
      if (!Board.eraseWall(e)) {
        Board.drawable = true;
        Board.onPress(e);
      }
    }
);
document.addEventListener("mouseup", () => (Board.drawable = false));
document.addEventListener("mousemove", (e) => Board.onPress(e));
startButton.addEventListener("click", function () {
  Board.start = true
  startButton.disabled = true
})


requestAnimationFrame(animate);
function animate() {
  ctx.clearRect(0, 0, cnv.width, cnv.height);
  Board.drawWalls()

  tanka.updateBullets(Board);
  tanka.tankBulletCol(shanka)
  if (!tanka.hit) {
    tanka.updateTankPos();
    tanka.drawTank();
  }
  
  shanka.updateBullets(Board);
  shanka.tankBulletCol(tanka)
  if (!shanka.hit) {
    shanka.updateTankPos();
    shanka.drawTank();
  }

  if (!tanka.hit && Board.start === true) {
    tanka.keyDowns("w", "s", "d", "a", "q");
    shanka.keyDowns("ArrowUp", "ArrowDown", "ArrowRight", "ArrowLeft", "m")
  }
  
  requestAnimationFrame(animate);
}